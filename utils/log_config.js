var log4js = require("log4js");
var path = require("path");
var fs = require("fs");
var basePath = path.resolve(__dirname, "../logs");

var errorPath = basePath + "/errors/";
var resPath = basePath + "/responses/";

var errorFilename = errorPath + "/err";
var resFilename = resPath + "/res";

/**
 * 确定目录是否存在，如果不存在则创建目录
 */
let logPath = function(pathStr) {
  if (!fs.existsSync(pathStr)) {
    fs.mkdirSync(pathStr);
    console.log("createPath: " + pathStr);
  }
};

//ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF（OFF是用来关闭日志记录的，不是日志记录的一个级别

log4js.configure({
  appenders: {
    errLog: {
      type: "dateFile", //日志类型
      filename: errorFilename, //日志输出位置
      alwaysIncludePattern: true, //是否总是有后缀名
      pattern: "-yyyy-MM-dd.log" //后缀，每小时创建一个新的日志文件
    },
    Log: {
      type: "dateFile",
      filename: resFilename,
      alwaysIncludePattern: true,
      pattern: "-yyyy-MM-dd.log"
    }
  },
  categories: {
    errLog: { appenders: ["errLog"], level: "error" },
    Log: { appenders: ["Log"], level: "info" },
    default: { appenders: ["Log", "errLog"], level: "trace" }
  },
  // pm2: true,
  // pm2InstanceVar: 'INSTANCE_ID',
  disableClustering: true
});
//创建log的根目录'logs'
if (basePath) {
  logPath(basePath);
  //根据不同的logType创建不同的文件目录
  logPath(errorPath);
  logPath(resPath);
}

// module.exports = log4js;
//https://blog.csdn.net/xiaoyangerbani/article/details/82319876

const errLog = log4js.getLogger("errLog");
const log = log4js.getLogger("Log"); //此处使用category的值

const logreq = (req, conn) => {
  if (req) log.info(formatReq(req));
  if (conn) log.info(formatConn(conn));
};
const logerr = err => errLog.error(formatError(err));

const getClientIp = function(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress ||
    ""
  );
};
//格式化请求日志
const formatReq = req => {
  const ip = getClientIp(req).match(/\d+.\d+.\d+.\d+/);
  let logText = new String("\n");
  //访问方法
  var method = req.method;
  logText += "[request] method: " + method + "\n";
  //请求原始地址
  logText += "[request] originalUrl:  " + req.originalUrl + "\n";
  //客户端ip
  if (!!req.headers["x-forwarded-for"]) {
    logText +=
      "req.headers['x-forwarded-for']: " +
      req.headers["x-forwarded-for"] +
      "\n";
  }
  if (!!req.connection) {
    if (!!req.connection.remoteAddress) {
      logText +=
        "req.connection.remoteAddress: " + req.connection.remoteAddress + "\n";
    }
    if (!!req.connection.socket) {
      if (!!req.connection.socket.remoteAddress) {
        logText +=
          "req.connection.socket.remoteAddress: " +
          req.connection.socket.remoteAddress +
          "\n";
      }
    }
  }
  if (!!req.socket && !!req.socket.remoteAddress) {
    logText += "req.socket.remoteAddress: " + req.socket.remoteAddress + "\n";
  }

  //客户端UA
  logText += "[request] user-agent:  " + req.headers["user-agent"] + "\n";
  //客户端请求内容类型
  logText += "[request] content-type:  " + req.headers["content-type"] + "\n";
  //请求参数
  if (method === "GET") {
    logText += "[request] query:  " + JSON.stringify(req.query) + "\n";
  } else {
    logText += "[request] body: " + "\n" + JSON.stringify(req.body) + "\n";
  }
  return logText;
};

const formatConn = conn => {
  let logText = new String("\n");
  logText += "[connection] query: \n" + conn.query;
  logText += "[connection] variables: " + JSON.stringify(conn.variables) + "\n";
  logText += "[connection] context: " + JSON.stringify(conn.context) + "\n";
  return logText;
};

//格式化错误日志
var formatError = function(err) {
  let logText = new String("\n");
  if (typeof err === "object") {
    //错误名称
    logText += "err name: " + err.name + "\n";
    //错误信息
    logText += "err message: " + err.message + "\n";
    //错误详情
    logText += "err stack: " + err.stack + "\n";
  } else if (typeof err === "string") {
    logtext = err;
  }
  return logText;
};

module.exports = {
  log,
  logreq,
  logerr
};
