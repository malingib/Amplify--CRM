import prisma from './prisma';
import { broadcastNotification, broadcastNotificationToRole } from '../websocket';

type TriggerType = 'lead_created' | 'lead_stage_changed' | 'invoice_created' | 'invoice_paid' | 'task_created' | 'task_completed';

interface TriggerData {
  lead?: any;
  invoice?: any;
  task?: any;
  oldStage?: string;
  newStage?: string;
  [key: string]: any;
}

function conditionsMatch(conditions: string | null, data: TriggerData) {
  if (!conditions) return true;
  try {
    const conds = JSON.parse(conditions);
    if (conds.field && conds.equals !== undefined && data[conds.field] !== conds.equals) return false;
    if (conds.field && conds.notEquals !== undefined && data[conds.field] === conds.notEquals) return false;
    return true;
  } catch {
    return false;
  }
}

async function executeWorkflow(workflow: any, data: TriggerData) {
  if (!conditionsMatch(workflow.conditions, data)) return null;

  let actions: any[];
  try {
    actions = JSON.parse(workflow.actions);
    if (!Array.isArray(actions)) throw new Error('Workflow actions must be an array');
  } catch (error) {
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        triggerData: JSON.stringify(data),
        result: JSON.stringify({ error: String(error) }),
        status: 'failed',
      },
    });
    return execution;
  }

  const executionResults: any[] = [];
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'send_telegram':
          executionResults.push({ type: action.type, status: 'queued' });
          break;
        case 'send_googlechat':
          executionResults.push({ type: action.type, status: 'queued' });
          break;
        case 'send_whatsapp':
          executionResults.push({ type: action.type, status: 'queued' });
          break;
        case 'update_field':
          if (!data.lead || !action.field || action.value === undefined) throw new Error('update_field requires a lead, field and value');
          await prisma.lead.update({ where: { id: data.lead.id }, data: { [action.field]: action.value } });
          executionResults.push({ type: action.type, status: 'success' });
          break;
        case 'create_task':
          if (!data.lead) throw new Error('create_task requires a lead');
          await prisma.task.create({
            data: {
              title: action.title || `Follow-up: ${data.lead.name}`,
              description: action.description || `Auto-created by workflow: ${workflow.name}`,
              assigneeId: data.lead.ownerId,
              dueDate: new Date(action.dueDate || Date.now() + 86400000 * 3),
              priority: action.priority || 'Medium',
            } as any,
          });
          executionResults.push({ type: action.type, status: 'success' });
          break;
        case 'notify_role':
          broadcastNotificationToRole(action.role || 'ADMIN', {
            title: action.title || 'Workflow Notification',
            message: action.message || `Workflow "${workflow.name}" triggered`,
            type: 'workflow',
          });
          executionResults.push({ type: action.type, status: 'success' });
          break;
        case 'notify_user':
          if (!data.lead?.ownerId) throw new Error('notify_user requires a lead owner');
          broadcastNotification(data.lead.ownerId, {
            title: action.title || 'Workflow Notification',
            message: action.message || `Workflow "${workflow.name}" triggered`,
            type: 'workflow',
          });
          executionResults.push({ type: action.type, status: 'success' });
          break;
        default:
          executionResults.push({ type: action.type, status: 'unknown_action' });
      }
    } catch (actionError) {
      executionResults.push({ type: action.type, status: 'failed', error: String(actionError) });
    }
  }

  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      triggerData: JSON.stringify(data),
      result: JSON.stringify(executionResults),
      status: executionResults.some(result => result.status === 'failed') ? 'failed' : 'success',
    },
  });
  await prisma.workflow.update({ where: { id: workflow.id }, data: { lastRun: new Date() } });
  return execution;
}

export async function runWorkflowById(workflowId: string, data: TriggerData) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow || !workflow.enabled) return null;
  const execution = await executeWorkflow(workflow, data);
  if (!execution) return null;
  return { workflow, execution };
}

export async function triggerWorkflows(triggerType: TriggerType, data: TriggerData) {
  try {
    const workflows = await prisma.workflow.findMany({ where: { enabled: true, trigger: triggerType } });
    for (const workflow of workflows) {
      await executeWorkflow(workflow, data);
    }
  } catch (error) {
    console.error('Workflow trigger error:', error);
  }
}
