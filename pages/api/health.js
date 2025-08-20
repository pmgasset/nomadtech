export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      message: 'NomadNet is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
