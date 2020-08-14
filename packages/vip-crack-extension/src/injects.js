import execute from "@/utils/execute";

const { default: coreStr } = require("!!raw-loader!vip-crack-core");
const funcWrapper = `function(){
  ${coreStr}
}`;
execute(funcWrapper);
