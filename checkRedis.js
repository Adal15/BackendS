const Redis = require('ioredis');
const { Queue } = require('bullmq');

const connection = new Redis('redis://127.0.0.1:6379');

connection.on('error', (err) => {
    console.error('Redis connection error:', err);
    process.exit(1);
});

connection.on('connect', async () => {
    console.log('Connected to Redis');

    const seoQueue = new Queue('seo-analysis', { connection });
    const jobCounts = await seoQueue.getJobCounts();
    console.log('Job counts:', jobCounts);

    const waitingJobs = await seoQueue.getWaiting();
    console.log('Waiting jobs count:', waitingJobs.length);

    const activeJobs = await seoQueue.getActive();
    console.log('Active jobs count:', activeJobs.length);

    process.exit(0);
});
