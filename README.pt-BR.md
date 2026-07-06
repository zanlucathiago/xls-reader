<h1 align="center">xls-reader</h1>

<p align="center">
  Leitor sem dependências para arquivos <strong><code>.xls</code> legados</strong> (BIFF8 — Excel 97–2003).<br />
  Retorna cada planilha como uma grade de células tipadas: strings, números, booleanos e datas.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/xls-reader"><img src="https://img.shields.io/npm/v/xls-reader.svg?color=cb3837&logo=npm" alt="versão no npm" /></a>
  <a href="https://www.npmjs.com/package/xls-reader"><img src="https://img.shields.io/npm/dm/xls-reader.svg?color=cb3837&logo=npm" alt="downloads no npm" /></a>
  <a href="https://github.com/zanlucathiago/xls-reader/actions/workflows/ci.yml"><img src="https://github.com/zanlucathiago/xls-reader/actions/workflows/ci.yml/badge.svg" alt="status do CI" /></a>
  <a href="https://codecov.io/gh/zanlucathiago/xls-reader"><img src="https://codecov.io/gh/zanlucathiago/xls-reader/branch/main/graph/badge.svg" alt="cobertura" /></a>
  <a href="https://bundlephobia.com/package/xls-reader"><img src="https://img.shields.io/bundlephobia/minzip/xls-reader.svg?label=min%2Bgzip" alt="tamanho do bundle" /></a>
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen.svg" alt="zero dependências" />
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/xls-reader.svg?color=blue" alt="licença MIT" /></a>
</p>

<p align="center">
  <a href="./README.md">English</a> · <strong>Português (BR)</strong>
</p>

Roda no Node e no navegador — só precisa de `Uint8Array` / `DataView`. São
**~3,8 KB min+gzip com zero dependências de runtime**, saída dupla ESM/CJS,
totalmente tipado, e publicado no npm com
[provenance](https://docs.npmjs.com/generating-provenance-statements).

```bash
npm install xls-reader
# ou: pnpm add xls-reader / yarn add xls-reader
```

## Conteúdo

- [Por que isso existe](#por-que-isso-existe)
- [Uso](#uso)
- [API](#api)
- [Comparação](#comparação)
- [Suportado](#suportado)
- [Limitações](#limitações)
- [Contribuindo](#contribuindo)

## Por que isso existe

Leitores modernos como o [ExcelJS](https://github.com/exceljs/exceljs) só lidam
com o formato mais novo `.xlsx` (OOXML). O leitor de `.xls` de facto,
[SheetJS](https://sheetjs.com), **não publica mais no registro do npm** — sua
última versão no npm (`0.18.5`) está congelada com vulnerabilidades conhecidas, e
as correções saem apenas do CDN próprio dele. Instalar de um CDN significa que o
`npm audit` e o Dependabot não enxergam o pacote, então você perde os alertas
automáticos de vulnerabilidade.

O `xls-reader` é uma alternativa pequena, focada e **publicada no npm** para o
caso comum: _ler as células de um `.xls` legado_. Sem dependências, licença MIT,
coberto pelas mesmas ferramentas de supply-chain do resto da sua árvore.

## Uso

```ts
import { readFile } from "node:fs/promises";
import { readXls } from "xls-reader";

const workbook = readXls(await readFile("posicao.xls"));

for (const sheet of workbook.sheets) {
  console.log(sheet.name);
  for (const row of sheet.rows) {
    console.log(row); // ex.: ["BANCO DAYCOVAL S/A", "CDB", "CDI", 1.1, Date(2024-04-02), 1000, ...]
  }
}
```

Atalho para uma única planilha:

```ts
import { readFirstSheet } from "xls-reader";

const sheet = readFirstSheet(bytes);
```

No navegador (ex.: a partir de um `<input>` de arquivo):

```ts
import { readXls } from "xls-reader";

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) return;
  const workbook = readXls(await file.arrayBuffer());
  console.table(workbook.sheets[0]?.rows);
});
```

Tratando uma entrada que não é `.xls`:

```ts
import { readXls, XlsError } from "xls-reader";

try {
  const workbook = readXls(bytes);
} catch (err) {
  if (err instanceof XlsError) {
    // Não é um .xls BIFF — ex.: é na verdade um .xlsx, CSV ou HTML rotulado como .xls
    console.error(err.message);
  } else {
    throw err;
  }
}
```

## API

### `readXls(data: ArrayBuffer | Uint8Array): Workbook`

Faz o parsing do workbook inteiro. Lança `XlsError` se os bytes não forem um
`.xls` BIFF.

### `readFirstSheet(data): Sheet | undefined`

A primeira planilha, para o caso de uma única aba.

### `excelSerialToDate(serial: number, date1904: boolean): Date`

A conversão bruta de número serial → `Date` (UTC), caso você precise dela
diretamente.

### Tipos

```ts
type Cell = string | number | boolean | Date | null;

interface Sheet {
  name: string;
  rows: Cell[][]; // densa, preenchida com null até a última coluna usada
}

interface Workbook {
  sheets: Sheet[];
}
```

- **Números** voltam como `number` (tanto na codificação `NUMBER` quanto na
  compacta `RK`).
- **Datas** — um número cujo formato de célula é de data/hora (embutido ou
  customizado) volta como `Date` (UTC). Use `excelSerialToDate` se precisar da
  conversão bruta.
- Células **em branco / de erro** viram `null`.

## Comparação

|                                       | **xls-reader** | SheetJS (`xlsx`)         | ExcelJS |
| ------------------------------------- | -------------- | ------------------------ | ------- |
| Lê `.xls` legado (BIFF8)              | ✅             | ✅                       | ❌      |
| Lê `.xlsx` (OOXML)                    | ❌             | ✅                       | ✅      |
| Correções recentes no registro do npm | ✅             | ⚠️ congelado em `0.18.5` | ✅      |
| Dependências de runtime               | **0**          | várias                   | várias  |
| Tamanho de instalação                 | ~4 KB min+gzip | grande                   | grande  |
| Atestado de provenance no npm         | ✅             | ❌                       | ❌      |
| Escreve arquivos / estilos / gráficos | ❌             | ✅                       | ✅      |

Se você precisa **escrever** planilhas, estilizar células ou ler `.xlsx`, use o
ExcelJS ou o SheetJS. O `xls-reader` faz uma coisa de propósito: extrair os
valores de um `.xls` legado.

## Suportado

- Container OLE2 / Compound File (streams normais **e** mini streams).
- Registros BIFF8: `LABELSST`, `LABEL`, `RSTRING`, `NUMBER`, `RK`, `MULRK`,
  `BLANK`, `MULBLANK`, `BOOLERR`, `FORMULA` (+ seu resultado `STRING`).
- Tabela de strings compartilhadas (`SST`), incluindo strings divididas entre
  registros `CONTINUE`.
- Detecção de datas via `XF` + `FORMAT`, e os sistemas de data 1900 / 1904.

## Limitações

- Somente leitura, e lê **valores** — não estilos, geometria de células
  mescladas ou gráficos.
- Apenas BIFF8 (Excel 97+). Não lê os bem mais antigos BIFF5/BIFF2, nem os
  arquivos HTML/XML que algumas ferramentas rotulam erradamente como `.xls`
  (confira os magic bytes).
- Workbooks criptografados não são suportados.
- Datas anteriores a 1900-03-01 no sistema 1900 ficam com um dia de diferença
  (o bug histórico de ano bissexto do Excel); dados do mundo real não são
  afetados.

## Contribuindo

Relatos de bug, arquivos de exemplo e PRs são muito bem-vindos — veja
[CONTRIBUTING.md](./CONTRIBUTING.md). Leia também o
[Código de Conduta](./CODE_OF_CONDUCT.md). Para reportar um problema de
segurança, veja a [Política de Segurança](./SECURITY.md).

## Licença

[MIT](./LICENSE) © Thiago Zanluca
