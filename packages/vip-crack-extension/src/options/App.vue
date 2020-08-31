<template>
  <div class="options-box">
    <div class="header">
      <div class="header-content">
        <span class="header-title">Settings</span>
        <div class="header-box">
          <img
            class="github"
            src="@/assets/img/github.png"
            @click="jumpToGithub"
          />
          <a
            id="rate-me"
            class="rate"
            title="Give me 5 stars!"
            @click="jumpToStar"
          >
            <img src="@/assets/img/heart-red.png" />
            <span>Rate this extension</span>
          </a>
        </div>
      </div>
    </div>

    <div class="content-box">
      <div class="toolbar">
        <el-input
          v-model="searchText"
          size="small"
          placeholder="请输入接口名称或接口地址"
        ></el-input>
        <div class="toolbar-box">
          <el-upload
            class="upload-btn"
            action=""
            :auto-upload="false"
            :show-file-list="false"
            accept=".txt"
            :on-change="uploadData"
          >
            <el-button size="small">上 传</el-button>
          </el-upload>
          <el-tooltip
            class="item"
            effect="dark"
            content="导出自定义api"
            placement="top-start"
          >
            <el-button size="small" @click="exportData">导 出</el-button>
          </el-tooltip>
          <el-button size="small" type="primary" @click="create"
            >创 建</el-button
          >
          <el-button
            size="small"
            type="danger"
            :disabled="!multipleSelection.length"
            @click="removeMulti"
            >删 除</el-button
          >
        </div>
      </div>
      <el-table
        :data="list"
        :empty-text="emptyText"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"> </el-table-column>
        <el-table-column prop="name" label="接口名称" width="280">
        </el-table-column>
        <el-table-column prop="url" label="接口地址"> </el-table-column>
        <el-table-column fixed="right" label="操作" width="200">
          <template slot-scope="{ row, $index }">
            <el-button size="small" @click="update(row)">编 辑</el-button>
            <el-button size="small" type="danger" @click="remove($index)"
              >删 除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="footer">
      <div class="footer-content">
        <div class="content-logo">
          <i class="logo--ico"></i>
          <div class="footer-content-info">
            <span class="content-info-name">{{ name }}</span>
            <br />
            <span class="content-info-ver">Version {{ version }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      title="自定义接口"
      :visible.sync="dialogVisible"
      width="30%"
      :close-on-click-modal="false"
      @closed="handleClose"
    >
      <el-form
        ref="form"
        size="small"
        :model="form"
        label-width="80px"
        :rules="rules"
      >
        <el-form-item label="接口名称" prop="name">
          <el-input v-model="form.name" placeholder="可不填"></el-input>
        </el-form-item>
        <el-form-item label="接口地址" prop="url">
          <el-input v-model="form.url" placeholder="请输入接口地址"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="dialogVisible = false">取 消</el-button>
        <el-button size="small" type="primary" @click="submit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import ApiUtil from "@/utils/ApiUtil";
import { name } from "@/manifest";
import { createNear } from "@/utils/tab";

export default {
  name: "Options",
  data() {
    return {
      name,
      version: process.env.npm_package_version,
      searchText: "",
      emptyText: "暂无自定义Api",
      customApiList: [],
      dialogVisible: false,
      form: {
        name: "",
        url: "",
      },
      rules: {
        url: [{ required: true, message: "请输入接口地址", trigger: "blur" }],
      },
      multipleSelection: [],
    };
  },
  computed: {
    // 没防抖，懒得管
    list() {
      if (this.searchText) {
        return this.customApiList.filter(i => {
          return (
            i.name.includes(this.searchText) || i.url.includes(this.searchText)
          );
        });
      } else {
        return this.customApiList;
      }
    },
  },
  created() {
    this.getData();
  },
  methods: {
    async getData() {
      this.customApiList = await ApiUtil.getCustom();
    },
    create() {
      this.dialogVisible = true;
    },
    update(item) {
      this.dialogVisible = true;
      this.form = { ...item };
    },
    async remove(index) {
      const result = await this.$confirm("确定删除？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (!result) return;
      const item = this.customApiList[index];
      await ApiUtil.remove(item);
      this.customApiList.splice(index, 1);
      this.$message.success("删除成功");
    },
    async removeMulti() {
      const result = await this.$confirm("确定删除？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      });
      if (!result) return;
      await ApiUtil.remove(this.multipleSelection);
      this.getData();
      this.$message.success("删除成功");
    },
    async submit() {
      const valid = await this.$refs.form.validate().catch(() => {});
      if (!valid) return;
      if (this.form.id) {
        await ApiUtil.update(this.form);
      } else {
        await ApiUtil.create(this.form);
      }
      this.$message.success("创建成功");
      this.getData();
      this.dialogVisible = false;
    },
    handleClose() {
      this.form = this.$options.data().form;
      this.$refs.form.resetFields();
    },
    uploadData(file) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // https://developer.mozilla.org/en-US/docs/Web/API/FileReader
          const apiList = JSON.parse(reader.result);
          await ApiUtil.create(apiList);
          this.$message.success("上传成功");
          this.getData();
        } catch (e) {
          console.error(e);
          this.$message.error("上传失败");
        }
      };
      reader.readAsText(file.raw);
    },
    exportData() {
      ApiUtil.export();
    },
    handleSelectionChange(val) {
      this.multipleSelection = val;
      console.log(val);
    },
    jumpToStar() {
      // chrome.runtime.id获取当前扩展的唯一id
      createNear({
        url:
          "https://chrome.google.com/webstore/detail/" +
          chrome.runtime.id +
          "/reviews",
      });
    },
    jumpToGithub() {
      window.open("https://github.com/hzmming/vip-crack");
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./options.scss";
</style>
