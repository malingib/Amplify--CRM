import application from '../server/dist/index.mjs';

export default function handler(req: any, res: any) {
  return application(req, res);
}
