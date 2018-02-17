const fs = require('fs');
const path = require('path');

const tests = {
  htl: [
    'comment/comment',
    'variable/variable',
    'variable/upper-context-variables',
    'raw/raw',
    'if/if',
    'if/if-else',
    'if/if-elseif',
    'if/if-else-if',
    'if/if-elseif-else',
    'if/if-complex',
    'for/for',
    'for/for-data',
    'for/for-index',
    'for/for-blockparams',
    // 'for/for-key', // array loops don't ever have a key in HTL
    'for/nested-for-blockparams',
    'for/nested-for-conditional',
    'for/nested-for-data',
    'partial/basic',
    // 'partial/context', // not supported in HTL
    'partial/dynamic',
    'partial/parameters',
  ],
  dtl: [
    'comment/comment',
    'variable/variable',
    'variable/upper-context-variables',
    'raw/raw',
    'if/if',
    'if/if-else',
    'if/if-elseif',
    'if/if-else-if',
    'if/if-elseif-else',
    'for/for',
    'for/for-data',
    'for/for-index',
    'for/for-blockparams',
    'for/for-key',
    'for/nested-for-blockparams',
    'for/nested-for-conditional',
    'for/nested-for-data',
    'partial/basic',
    // 'partial/context', // not supported in Django
    'partial/dynamic',
    'partial/parameters',
  ],
  twig: [
    'comment/comment',
    'variable/variable',
    'variable/upper-context-variables',
    'raw/raw',
    'if/if',
    'if/if-else',
    'if/if-elseif',
    'if/if-else-if',
    'if/if-elseif-else',
    'for/for',
    'for/for-data',
    'for/for-index',
    'for/for-blockparams',
    'for/for-key',
    'for/nested-for-blockparams',
    'for/nested-for-conditional',
    'for/nested-for-data',
    'partial/basic',
    'partial/context',
    'partial/dynamic',
    'partial/parameters',
  ]
};

const extensions = {
  htl: 'htl',
  dtl: 'dtl',
  twig: 'html.twig',
};

function generateSupportDoc(language) {
  let tableOfContents = '';
  let testsContent = '';
  let prevCategory = '';
  tests[language].forEach(value => {
    const input = fs.readFileSync(
      path.resolve(__dirname, `../test/fixtures/${value}.hbs`),
      'utf-8'
    );
    const output = fs.readFileSync(
      path.resolve(__dirname, `../test/fixtures/${value}.${extensions[language]}`),
      'utf-8'
    );

    const category = value.split('/').shift();
    if (category !== prevCategory) {
      tableOfContents += `* [${category}](#${category.toLowerCase()})\n`;
      testsContent += `
  ### ${category}
  `
    }
    prevCategory = category;

    tableOfContents += `  * [${value.split('/').slice(1).join('/')}](#${value.toLowerCase().replace(/\//gi, '')})\n`;

    testsContent += renderTest(value, input, output, 'htl');
  });

  const template = fs.readFileSync(
    path.resolve(__dirname, `./templates/support-${language}.md`),
    'utf-8'
  );

  const document = `
${template}

${tableOfContents}

${testsContent}
`;

  fs.writeFileSync(path.resolve(__dirname, `../docs/support-${language}.md`), document, 'utf-8');
}

function renderTest(value, input, output, language) {
  return `
#### ${value}

**hbs input**
\`\`\`html
${input}
\`\`\`

**${language} output**
\`\`\`html
${output}
\`\`\`
`
}

Object.keys(tests).forEach(generateSupportDoc);
