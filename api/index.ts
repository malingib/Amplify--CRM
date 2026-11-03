let applicationPromise: Promise<any> | undefined;

export default async function handler(req: any, res: any) {
  try {
    applicationPromise ??= import('../server/src/index').then((module) => module.default);
    const application = await applicationPromise;
    return application(req, res);
  } catch (error) {
    const cause = error instanceof Error ? error : new Error(String(error));
    const errorId = `API-BOOT-${Date.now().toString(36)}`;
    console.error(`[${errorId}] Amplify CRM API initialization failed`, cause);
    const diagnostics = process.env.API_DIAGNOSTICS === 'true';
    return res.status(500).json({
      error: 'API initialization failed',
      errorId,
      ...(diagnostics ? { detail: cause.message, stack: cause.stack?.split('\n').slice(0, 8) } : {}),
    });
  }
}
