<template>
  <div class="popup-box">
    <div class="header">
      Vip Crack
    </div>
    <div v-if="!isAdapted" class="disabled-tip">
      无法在此页上运行
    </div>
    <div v-else v-loading="showLoading">
      <div class="select-panel panel">
        <div class="select-box">
          <div class="prefix-tip">
            选择接口
          </div>
          <el-select
            v-model="selectedSourceId"
            size="small"
            placeholder="请选择接口"
            @change="selectSource"
          >
            <el-option
              v-for="item in apiList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </div>
        <el-button
          type="text"
          size="mini"
          class="manage-btn"
          @click="jumpToSetting"
        >
          管理接口
        </el-button>
      </div>
      <div class="separate-line"></div>
      <div class="update-panel panel">
        <h3 class="panel-title">
          更新接口与插件
        </h3>
        <div class="panel-body">
          <div class="update-content">
            <span class="interval">更新间隔</span>
            <el-select
              v-model="intervalVal"
              size="mini"
              placeholder="请选择"
              @change="updateInterval"
            >
              <el-option
                v-for="item in intervalList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-button type="primary" size="mini" @click="syncData">
              立即更新
            </el-button>
          </div>
        </div>
      </div>
      <div class="plugin-panel panel">
        <h3 class="panel-title">
          插件管理
        </h3>
        <div class="panel-body">
          <div class="plugin-list">
            <template v-for="item in pluginList">
              <el-tooltip
                :key="item.name"
                effect="dark"
                :content="item.description"
                placement="top-start"
              >
                <div class="plugin-item" @click="togglePlugin(item.name)">
                  <el-switch v-model="enableObj[item.name]" size="mini" />
                  <div class="plugin-name">{{ item.nickname }}</div>
                  <div class="plugin-version">
                    <span class="version-tip">version</span
                    ><span> {{ item.version }}</span>
                  </div>
                </div>
              </el-tooltip>
            </template>
          </div>
        </div>
      </div>
      <!-- <div class="devtool-panel">
      <el-button type="primary" size="mini" @click="clearAllData"
        >清空数据</el-button
      >
    </div> -->
    </div>
    <div class="footer">
      <img
        src="@/assets/img/heart-red.png"
        title="给我 5 星好评！"
        @click="jumpToStar"
      />
      <img
        src="@/assets/img/settings.png"
        title="设置"
        @click="jumpToSetting"
      />
    </div>
  </div>
</template>

<script>
import { hourToMillisecond } from "shared/util";
import ApiUtil from "@/utils/ApiUtil";
import PluginUtil from "@/utils/PluginUtil";
import Config from "@/utils/Config";
import { createNear, reload, getLocation } from "@/utils/tab";
import { sync } from "@/utils";

const intervalList = [
  {
    label: "从不",
    value: -1,
  },
  {
    label: "每 6 小时",
    value: hourToMillisecond(6),
  },
  {
    label: "每 12 小时",
    value: hourToMillisecond(12),
  },
  {
    label: "每天",
    value: hourToMillisecond(24),
  },
  {
    label: "每周",
    value: hourToMillisecond(7 * 24),
  },
];

export default {
  name: "Popup",
  data() {
    return {
      intervalList,
      intervalVal: null,
      apiList: [],
      pluginList: [],
      selectedSourceId: "",
      enableObj: {},
      showLoading: false,
      isAdapted: false,
    };
  },
  created() {
    this.getApiList();
    this.getPluginList();
    this.getConfig();
  },
  methods: {
    async getApiList() {
      this.apiList = await ApiUtil.get();
    },
    async getPluginList() {
      this.pluginList = await PluginUtil.get();
      const url = await getLocation();
      const result = this.pluginList.find(plugin => {
        return url.includes(plugin.url);
      });
      this.isAdapted = !!result;
    },
    async getConfig() {
      const config = await Config.get();
      this.selectedSourceId = config.selectedSourceId;
      this.enableObj = config.enableObj;
      this.intervalVal = config.intervalVal;
    },
    async syncData() {
      this.showLoading = true;
      const result = await sync();
      if (!result) {
        this.$message.error({
          message: "同步失败",
          customClass: "mini-message",
        });
        return;
      }
      this.showLoading = false;
      this.$message.success({
        message: "同步成功",
        customClass: "mini-message",
      });
      this.getApiList();
      this.getPluginList();
      this.getConfig();
    },
    async togglePlugin(name) {
      const enableObj = await Config.get("enableObj");
      this.enableObj[name] = enableObj[name] = !enableObj[name];
      await Config.set("enableObj", enableObj);
    },
    clearAllData() {
      chrome.storage.sync.clear();
      chrome.storage.local.clear();
    },
    async updateInterval() {
      await Config.set("intervalVal", this.intervalVal);
    },
    jumpToStar() {
      // chrome.runtime.id获取当前扩展的唯一id
      createNear({
        url:
          "https://chrome.google.com/webstore/detail/" +
          chrome.runtime.id +
          "/reviews",
        closeWindow: true,
      });
    },
    jumpToSetting() {
      createNear({ url: "options.html", closeWindow: true });
    },
    selectSource() {
      reload();
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./popup.scss";
</style>
<style lang="scss">
.mini-message {
  min-width: 140px !important;
}
</style>
