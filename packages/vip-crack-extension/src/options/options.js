import Vue from "vue";
import App from "./App";
import {
  Button,
  Dialog,
  Form,
  FormItem,
  Input,
  Select,
  Option,
  Popover,
  Switch,
  Table,
  TableColumn,
  Tooltip,
  Message,
  Loading,
  MessageBox,
  Upload,
} from "element-ui";

Vue.use(Button);
Vue.use(Dialog);
Vue.use(Upload);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Input);
Vue.use(Select);
Vue.use(Option);
Vue.use(Popover);
Vue.use(Switch);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Tooltip);
Vue.use(Loading.directive);

Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;
Vue.prototype.$msgbox = MessageBox;
Vue.prototype.$alert = MessageBox.alert;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;

new Vue({
  el: "#app",
  render: h => h(App),
});
