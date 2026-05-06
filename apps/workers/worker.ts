import { healthCheckJob } from './jobs/health-check';

type Env = {
  API_HEALTH_URL: string;
};

type JobResult = Record<string, unknown> | undefined;

type WorkerJob = {
  name: string;
  description: string;
  cron: string;
  run: (env: Env) => Promise<JobResult>;
};

type CronController = {
  cron: string;
  scheduledTime: number;
  type: 'scheduled' | string;
};

type WorkerExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void;
};

type WorkerEntrypoint<EnvBindings> = {
  fetch?: (request: Request, env: EnvBindings, ctx: WorkerExecutionContext) => Promise<Response>;
  scheduled?: (controller: CronController, env: EnvBindings, ctx: WorkerExecutionContext) => void | Promise<void>;
};

const registeredJobs: WorkerJob[] = [
  healthCheckJob,
];

const errorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

const runJobs = async (jobs: WorkerJob[], env: Env) => {
  const results: Array<Record<string, unknown>> = [];

  for (const job of jobs) {
    try {
      const details = await job.run(env);
      console.log(`[job:${job.name}] status=ok`);
      results.push({
        name: job.name,
        ok: true,
        details: details ?? null,
      });
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[job:${job.name}] status=error message="${message}"`);
      results.push({
        name: job.name,
        ok: false,
        error: message,
      });
    }
  }

  return {
    ok: results.every((result) => result.ok === true),
    results,
  };
};

const worker: WorkerEntrypoint<Env> = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return Response.json({
        ok: true,
        jobs: registeredJobs.map((job) => ({
          name: job.name,
          description: job.description,
          cron: job.cron,
        })),
        runEndpoint: '/run?name=<job-name>',
      });
    }

    if (url.pathname !== '/run') {
      return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    const jobName = url.searchParams.get('name');
    const selectedJob = jobName ? registeredJobs.find((job) => job.name === jobName) : null;

    if (jobName && !selectedJob) {
      return Response.json(
        {
          ok: false,
          error: `Unknown job "${jobName}"`,
          availableJobs: registeredJobs.map((job) => job.name),
        },
        { status: 404 },
      );
    }

    const targetJobs = selectedJob ? [selectedJob] : registeredJobs;
    const report = await runJobs(targetJobs, env);
    return Response.json(report, { status: report.ok ? 200 : 500 });
  },

  async scheduled(controller, env, ctx) {
    const matchingJobs = registeredJobs.filter((job) => job.cron === controller.cron);

    if (matchingJobs.length === 0) {
      console.warn(`[worker-orchestrator] no jobs matched cron="${controller.cron}"`);
      return;
    }

    ctx.waitUntil(
      (async () => {
        const report = await runJobs(matchingJobs, env);
        if (!report.ok) {
          throw new Error(`One or more jobs failed for cron "${controller.cron}"`);
        }
      })(),
    );
  },
};

export default worker;
