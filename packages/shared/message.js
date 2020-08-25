const COLOR = {
  log: "#1475b2",
  info: "#606060",
  error: "#f56c6c",
};
const message = ({ type, msg }) => {
  if (process.env.ENV !== "local") return;
  console.log(
    "%c vip-crack-extension",
    `padding: 1px; border-radius: 0 3px 3px 0; color: #fff; background:${COLOR[type]}`,
    ...msg
  );
};

function error(...msg) {
  message({
    type: "error",
    msg: [...msg],
  });
}

function log(...msg) {
  message({
    type: "log",
    msg: [...msg],
  });
}

export { error, log };
