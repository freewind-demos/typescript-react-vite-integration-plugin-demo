import generate from '@babel/generator'
import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import { Plugin } from 'vite'

export interface FunctionLoggerOptions {
    // 要记录的函数名pattern,支持字符串或正则
    pattern?: string | RegExp
    // 是否启用插件
    enabled?: boolean
}

export default function functionLogger(options: FunctionLoggerOptions = {}): Plugin {
    const {
        pattern = /.*/,
        enabled = true
    } = options

    return {
        name: 'vite-plugin-function-logger',
        enforce: 'pre',

        transform(code: string, id: string) {
            // 只处理js/ts文件
            if (!enabled || !/\.[jt]sx?$/.test(id)) {
                return null
            }

            // 解析代码为AST
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx']
            })

            // 是否有修改
            let hasModification = false

            // 遍历AST
            traverse(ast, {
                FunctionDeclaration(path) {
                    const funcName = path.node.id?.name
                    if (funcName && matchPattern(funcName, pattern)) {
                        injectLogger(path, funcName)
                        hasModification = true
                    }
                },

                VariableDeclarator(path) {
                    if (t.isArrowFunctionExpression(path.node.init)) {
                        const funcName = t.isIdentifier(path.node.id) ? path.node.id.name : undefined
                        if (funcName && matchPattern(funcName, pattern)) {
                            injectLogger(path.get('init'), funcName)
                            hasModification = true
                        }
                    }
                }
            })

            // 如果有修改则生成新代码
            if (hasModification) {
                const output = generate(ast)
                return {
                    code: output.code,
                    map: output.map
                }
            }

            return null
        }
    }
}

// 检查函数名是否匹配pattern
function matchPattern(name: string, pattern: string | RegExp): boolean {
    if (typeof pattern === 'string') {
        return name === pattern
    }
    // 如果是正则表达式,确保完全匹配
    const regexStr = pattern.toString()
    const isFullMatch = regexStr.startsWith('/^') && regexStr.endsWith('$/')
    if (!isFullMatch) {
        pattern = new RegExp(`^${pattern.source}$`)
    }
    return pattern.test(name)
}

// 注入console.log
function injectLogger(path: any, funcName: string) {
    const logMessage = `Entering function: ${funcName}`

    const logStatement = t.expressionStatement(
        t.callExpression(
            t.memberExpression(t.identifier('console'), t.identifier('log')),
            [t.stringLiteral(logMessage)]
        )
    )

    if (t.isBlockStatement(path.node.body)) {
        path.node.body.body.unshift(logStatement)
    } else {
        const block = t.blockStatement([
            logStatement,
            t.returnStatement(path.node.body)
        ])
        path.get('body').replaceWith(block)
    }
} 