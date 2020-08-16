import Vue from "vue";
import App from "./App";
import {
  Button,
  Select,
  Option,
  Popover,
  Switch,
  Tooltip,
  Message,
  Loading,
} from "element-ui";

Vue.use(Button);
Vue.use(Select);
Vue.use(Option);
Vue.use(Popover);
Vue.use(Switch);
Vue.use(Tooltip);
Vue.use(Loading.directive);

Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;

new Vue({
  el: "#app",
  render: h => h(App),
});
