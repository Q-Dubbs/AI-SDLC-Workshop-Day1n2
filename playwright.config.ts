const config = {
  testDir: "./tests",
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    timezoneId: "Asia/Singapore",
    trace: "on-first-retry"
  }
};

export default config;