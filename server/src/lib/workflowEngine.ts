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

export async function triggerWorkflows(triggerType: TriggerType, data: TriggerData) {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { enabled: true, trigger: triggerType },
    });

    for (const workflow of workflows) {
      let conditionsMet = true;

      if (workflow.conditions) {
        const conds = JSON.parse(workflow.conditions);
        if (conds.field && conds.equals) {
          conditionsMet = data[conds.field] === conds.equals;
        }
        if (conds.field && conds.notEquals) {
          conditionsMet = data[conds.field] !== conds.notEquals;
        }
      }

      if (!conditionsMet) continue;

      const actions = JSON.parse(workflow.actions);
      const executionResults = [];

      for (const action of actions) {
        try {
          switch (action.type) {
            case 'send_telegram':
              executionResults.push({ type: 'send_telegram', status: 'queued' });
              break;
            case 'send_googlechat':
              executionResults.push({ type: 'send_googlechat', status: 'queued' });
              break;
            case 'send_whatsapp':
              executionResults.push({ type: 'send_whatsapp', status: 'queued' });
              break;
            case 'update_field':
              if (data.lead && action.field && action.value !== undefined) {
                await prisma.lead.update({
                  where: { id: data.lead.id },
                  data: { [action.field]: action.value },
                });
                executionResults.push({ type: 'update_field', status: 'success' });
              }
              break;
            case 'create_task':
              if (data.lead) {
                await prisma.task.create({
                  data: {
                    title: action.title || `Follow-up: ${data.lead.name}`,
                    description: action.description || `Auto-created by workflow: ${workflow.name}`,
                    assigneeId: data.lead.ownerId,
                    dueDate: new Date(action.dueDate || Date.now() + 86400000 * 3),
                    priority: action.priority || 'Medium',
                  } as any,
                });
                executionResults.push({ type: 'create_task', status: 'success' });
              }
              break;
            case 'notify_role':
              broadcastNotificationToRole(action.role || 'ADMIN', {
                title: action.title || 'Workflow Notification',
                message: action.message || `Workflow "${workflow.name}" triggered`,
                type: 'workflow',
              });
              executionResults.push({ type: 'notify_role', status: 'success' });
              break;
            case 'notify_user':
              if (data.lead?.ownerId) {
                broadcastNotification(data.lead.ownerId, {
                  title: action.title || 'Workflow Notification',
                  message: action.message || `Workflow "${workflow.name}" triggered`,
                  type: 'workflow',
                });
                executionResults.push({ type: 'notify_user', status: 'success' });
              }
              break;
            default:
              executionResults.push({ type: action.type, status: 'unknown_action' });
          }
        } catch (actionError) {
          executionResults.push({ type: action.type, status: 'failed', error: String(actionError) });
        }
      }

      await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          triggerData: JSON.stringify(data),
          result: JSON.stringify(executionResults),
          status: executionResults.some((r: any) => r.status === 'failed') ? 'failed' : 'success',
        },
      });

      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { lastRun: new Date() },
      });
    }
  } catch (error) {
    console.error('Workflow trigger error:', error);
  }
}
