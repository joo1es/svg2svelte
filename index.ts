import fs from 'fs-extra'
import inquirer from 'inquirer'

const svgs = fs.readdirSync('./src')
if (svgs.length === 0) {
    console.error('No svgs found in ./src')
    process.exit(1)
}

const questions = [
    {
        type: 'list',
        name: 'lang',
        message: 'Which language do you want to generate?',
        choices: ['typescript', 'javascript'],
        default: 'typescript'
    }
]

const answers = await inquirer.prompt(questions)

if (!fs.pathExistsSync('./dist')) {
    fs.mkdirSync('./dist')
} else {
    fs.emptyDirSync('./dist')
}

let indexArray: string[] = []

for (const svg of svgs) {
    if (!svg.endsWith('.svg')) continue
    const name = toUpperCamelCase(svg.replace('.svg', ''))
    const template = getTemplate(name, fs.readFileSync(`./src/${svg}`, 'utf8'))
    fs.writeFileSync(`./dist/${name}.vue`, template)
    indexArray.push(`export { default as ${name} } from './${name}.vue'`)
}

fs.writeFileSync(`./dist/index.${answers.lang === 'typescript' ? 'ts' : 'mjs'}`, indexArray.join('\n'))

function getTemplate (name: string, svg: string) {
    return `<template>
    ${svg}
</template>

<script ${answers.lang === 'typescript' ? 'lang="ts"' : ''}>
import { defineComponent } from 'vue'

export default defineComponent({
    name: '${name}'
})
</script>`
}

function toUpperCamelCase (str: string) {
    return str.replace(/[-_]([a-z\d])/g, (g) => g[1]?.toUpperCase()).replace(/^./, (g) => g?.toUpperCase() || g)
}
