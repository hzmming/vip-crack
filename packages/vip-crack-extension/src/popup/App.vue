<template>
  <div class="popup-box">
    <el-button type="primary">hello world</el-button>
    <el-button type="primary" icon="el-icon-search">搜索</el-button>
    <el-select v-model="value" placeholder="请选择">
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
    <img src="@/assets/img/fail.jpg" />
  </div>
</template>

<script>
export default {
  name: "Popup",
  data() {
    return {
      options: [
        {
          value: "选项1",
          label: "黄金糕",
        },
        {
          value: "选项2",
          label: "双皮奶",
        },
        {
          value: "选项3",
          label: "蚵仔煎",
        },
        {
          value: "选项4",
          label: "龙须面",
        },
        {
          value: "选项5",
          label: "北京烤鸭",
        },
      ],
      value: "",
    };
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.popup-box {
  width: 300px;
}
</style>
