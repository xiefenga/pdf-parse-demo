import { useState } from "react";
import JSONPretty from "react-json-pretty";
import { Button, Upload, message } from "antd";

export default function Home() {
  const [json, setJson] = useState<object>({});

  return (
    <div className="max-w-7xl m-auto">
      <h1 className="text-6xl text-center leading-loose pt-8">PDF解析</h1>
      <div className="flex justify-center items-center my-8">
        <Upload
          maxCount={1}
          action="/api/pdf"
          showUploadList={false}
          beforeUpload={() => setJson({})}
          onChange={(e) => {
            if (e.file.status === "done") {
              setJson(e.file.response.data);
            } else if (e.file.status === "error") {
              message.error(e.file.response);
            }
          }}
        >
          <Button>上传PDF</Button>
        </Upload>
      </div>
      <JSONPretty id="json" data={json} />
    </div>
  );
}
