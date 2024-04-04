import { IncomingForm } from 'formidable'
import PDFParser from "pdf2json"

export const config = {
  api: {
    bodyParser: false,
  }
}

const titleYRange = [4.222, 5.07]

const titleXRanges = [
  [3.209, 6],
  [6.499, 16],
  [16.242, 20],
  [20.997, 26],
  [26.149, 31],
  [31.294, 41.044],
]

const between = (value, range) => value >= range[0] && value <= range[1]

export default async function handler(
  req,
  res
) {

  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm()

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve({ fields, files })
    })

  })

  // @ts-expect-error
  const filepath = data.files.file[0].filepath

  // const content = await readFile(filepath, 'utf8')

  const pdfParser = new PDFParser()

  pdfParser.on("pdfParser_dataError", errData => {
    res.status(500).json({ error: errData.parserError })
  });

  pdfParser.on("pdfParser_dataReady", pdfData => {

    const validPages = pdfData.Pages.filter(page => page.Texts.length)

    // 着色区域
    const pageFills = validPages.map(page => page.Fills.filter(item => item.oc).filter(item => item.h > 1 && item.w > 1))

    const pageTexts = validPages.map(page => page.Texts.map(({ x, y, w, R }) => ({ x, y, w, text: decodeURIComponent(R[0].T) })))


    const x = pageFills.map((fills, index) => {
      const currentPageTexts = fills.map(fill => {
        fill.y = Number(fill.y.toFixed(1)) - 0.1
        return pageTexts[index]
          .filter(text => text.x >= fill.x && text.x <= fill.x + fill.w && text.y >= fill.y && text.y <= fill.y + fill.h)
          .reduce((memo, item) => {
            if (between(item.x, titleXRanges[0])) {
              memo.title = item.text
            } else if (between(item.x, titleXRanges[1])) {
              memo.workContent ??= []
              memo.workContent.push(item)
            } else if (between(item.x, titleXRanges[2])) {
              memo.workload ??= []
              memo.workload.push(item)
            } else if (between(item.x, titleXRanges[3])) {
              memo.startTime ??= []
              memo.startTime.push(item)
            } else if (between(item.x, titleXRanges[4])) {
              memo.endTime ??= []
              memo.endTime.push(item)
            } else if (between(item.x, titleXRanges[5])) {
              memo.remark ??= []
              memo.remark.push(item)
            }
            return memo
          }, {})
      })
      const parsed = currentPageTexts.map(item => {
        const obj = {}
        obj.title = item.title
        item.workContent.forEach(work => {
          obj.works ??= []
          obj.works.push({
            work: work.text,
            workload: item.workload.find(item => item.y === work.y)?.text ?? '',
            startTime: item.startTime.find(item => item.y === work.y)?.text ?? '',
            endTime: item.endTime.find(item => item.y === work.y)?.text ?? '',
            remark: item.remark.find(item => item.y === work.y)?.text ?? '',
          })
        })
        return obj
      })
      return parsed
    })

    res.status(200).json({ data: x })
  });

  pdfParser.loadPDF(filepath);

}
