import { unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import { RollupOutput } from 'rollup'
import { build } from 'vite'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import functionLogger from './vite-plugin-function-logger'

describe('vite-plugin-function-logger integration tests', () => {
    const tempFile = join(__dirname, 'temp-test.ts')

    beforeEach(() => {
        // 确保开始测试前临时文件不存在
        try {
            unlinkSync(tempFile)
        } catch (e) {
            // 忽略文件不存在的错误
        }
    })

    afterEach(() => {
        // 清理临时文件
        try {
            unlinkSync(tempFile)
        } catch (e) {
            // 忽略文件不存在的错误
        }
    })

    test('should inject logger into function declaration', async () => {
        // 写入测试代码到临时文件
        const testCode = `
            function hello() {
                return 'world'
            }
            hello()
        `
        writeFileSync(tempFile, testCode)

        // 使用vite build API
        const result = await build({
            build: {
                minify: false,
                write: false,
                rollupOptions: {
                    input: tempFile,
                    treeshake: false
                }
            },
            plugins: [functionLogger()]
        }) as RollupOutput

        // 获取构建结果
        const output = result.output[0].code

        // 验证结果包含注入的日志
        expect(output).toMatchInlineSnapshot(`
          "function hello() {
            console.log("Entering function: hello");
            return "world";
          }
          hello();
          "
        `)
    })

    test('should inject logger into arrow function', async () => {
        const testCode = `
            const greet = () => {
                return 'hello'
            }
            greet()
        `
        writeFileSync(tempFile, testCode)

        const result = await build({
            build: {
                minify: false,
                write: false,
                rollupOptions: {
                    input: tempFile,
                    treeshake: false
                }
            },
            plugins: [functionLogger()]
        }) as RollupOutput

        const output = result.output[0].code
        expect(output).toMatchInlineSnapshot(`
          "const greet = () => {
            console.log("Entering function: greet");
            return "hello";
          };
          greet();
          "
        `)
    })

    test('should only inject logger for functions matching pattern', async () => {
        const testCode = `
            function test1() { return 1 }
            function test2() { return 2 }
            console.log(test1())
            console.log(test2())
        `
        writeFileSync(tempFile, testCode)

        const result = await build({
            build: {
                minify: false,
                write: false,
                rollupOptions: {
                    input: tempFile,
                    treeshake: false
                }
            },
            plugins: [functionLogger({ pattern: 'test1' })]
        }) as RollupOutput

        const output = result.output[0].code
        expect(output).toMatchInlineSnapshot(`
          "function test1() {
            console.log("Entering function: test1");
            return 1;
          }
          function test2() {
            return 2;
          }
          console.log(test1());
          console.log(test2());
          "
        `)
    })

    test('should not transform when disabled', async () => {
        const testCode = `
            function hello() {
                return 'world'
            }
            hello()
        `
        writeFileSync(tempFile, testCode)

        const result = await build({
            build: {
                minify: false,
                write: false,
                rollupOptions: {
                    input: tempFile,
                    treeshake: false
                }
            },
            plugins: [functionLogger({ enabled: false })]
        }) as RollupOutput

        const output = result.output[0].code
        expect(output).toMatchInlineSnapshot(`
          "function hello() {
            return "world";
          }
          hello();
          "
        `)
    })

    test('should handle arrow function with expression body', async () => {
        const testCode = `
            const sum = (a, b) => a + b
            sum(1, 2)
        `
        writeFileSync(tempFile, testCode)

        const result = await build({
            build: {
                minify: false,
                write: false,
                rollupOptions: {
                    input: tempFile,
                    treeshake: false
                }
            },
            plugins: [functionLogger()]
        }) as RollupOutput

        const output = result.output[0].code
        expect(output).toMatchInlineSnapshot(`
          "const sum = (a, b) => {
            console.log("Entering function: sum");
            return a + b;
          };
          sum(1, 2);
          "
        `)
    })
}) 