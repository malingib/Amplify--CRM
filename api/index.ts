import application from '../server/src/index.ts';

export default function handler(req: any, res: any) {
  return application(req, res);
}
