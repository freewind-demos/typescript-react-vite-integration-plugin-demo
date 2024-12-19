# Vite Plugin Integration Test Demo

这个项目展示了如何为vite插件编写集成测试。

## 项目结构

- `plugins/vite-plugin-function-logger.ts` - 一个示例vite插件,用于在函数开头注入日志
- `plugins/vite-plugin-function-logger.integration.test.ts` - 插件的集成测试

## 集成测试特点

这个项目展示了以下测试实践:

1. 使用vite的build API进行黑盒测试
   - 不直接调用插件的transform方法
   - 通过完整的构建流程测试插件

2. 使用临时文件进行测试
   - 在测试中动态创建源文件
   - 测试后自动清理

3. 禁用构建优化以获得可预测的结果
   - 关闭代码压缩(minify: false)
   - 关闭tree shaking(treeshake: false)

4. 使用快照测试验证输出
   - 使用toMatchInlineSnapshot验证转换结果
   - 保持测试代码的可读性

## 测试用例

测试覆盖了插件的主要功能:

1. 普通函数声明的日志注入
2. 箭头函数的日志注入
3. 基于pattern的选择性注入
4. 插件启用/禁用功能
5. 表达式体箭头函数处理

## 运行测试

```bash
pnpm install
pnpm test
```

## 关键点

1. 为什么使用集成测试?
   - 更接近真实使用场景
   - 验证与vite的集成
   - 发现构建过程中的问题

2. 为什么使用黑盒方式?
   - 测试外部行为而不是实现细节
   - 更容易维护
   - 重构时不需要修改测试

3. 处理构建优化
   - 禁用优化以获得可预测的结果
   - 确保测试结果的一致性

## 许可

MIT

```
npm install
npm run demo
```

It will open page on browser automatically.
