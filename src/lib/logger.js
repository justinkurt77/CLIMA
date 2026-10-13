const isProd = import.meta.env.MODE === 'production';

export const logger = {
  info: (msg, data) => {
    if (!isProd) console.log(msg, data);
  },
  warn: (msg, data) => {
    if (!isProd) console.warn(msg, data);
  },
  error: (msg, err) => {
    if (isProd) {
      console.error(msg, err?.message || 'Unknown error');
    } else {
      console.error(msg, err);
    }
  },
  debug: (msg, data) => {
    if (!isProd) console.debug(msg, data);
  }
};
