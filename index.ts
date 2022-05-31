import fs from 'fs-extra'
import inquirer from 'inquirer'
import path from 'path'

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

const indexArray: string[] = []

for (const svg of svgs) {
    const { ext } = path.parse(svg)
    if (ext !== '.svg') continue

    const name = toUpperCamelCase(svg.replace(/\.svg$/i, ''))
    const template = getTemplate(name, fs.readFileSync(`./src/${svg}`, 'utf8'))
    fs.writeFileSync(`./dist/${name}.svelte`, template)
    indexArray.push(`export { default as ${name} } from './${name}.svelte'`)
}

fs.writeFileSync(`./dist/index.${answers.lang === 'typescript' ? 'ts' : 'mjs'}`, indexArray.join('\n'))

function getTemplate (name: string, svg: string) {
    // only need svg part
    svg = svg
        .replace(/^.*?(<svg(.*)<\/svg>).*?$/, '$1')
        .replace(/<style(.*)<\/style>/, '')
        .replace(/<script(.*)<\/script>/, '')

    // svg = svg.replace(/stroke:(.*?);/g, 'stroke:currentColor;')

    const ids = svg.matchAll(/ id=\"(.+?)\"/g)

    const data: [string, string][] = []
    let count = 0

    // id should be unique
    for (const id of ids) {
        if (!id[1]) continue
        const currentId = `id${count}`
        svg = svg
            .replace(id[0], ` id={${currentId}}`)
            .replace(new RegExp(` ([a-z]+?)="url\\(#${id[1]}\\)"`, 'g'), ` $1={'url(#' + ${currentId} + ')'}`)
        data.push([currentId, `'${id[1]}_' + randomString`])
        count += 1
    }

    const dataString = count > 0 ? `const randomString = Math.random().toString(36).slice(-10)
    ${data.map(item => `const ${item[0]} = ${item[1]}`).join('\n    ')}` : ''

    const script = dataString ? `<script ${answers.lang === 'typescript' ? 'lang="ts"' : ''}>\n    ${dataString}\n</script>\n\n` : ''

    return script + svg + '\n'
}

function toUpperCamelCase (str: string) {
    return str.replace(/[-_]([A-Za-z\d])/g, (g) => g[1]?.toUpperCase()).replace(/^./, (g) => g?.toUpperCase() || g)
}
