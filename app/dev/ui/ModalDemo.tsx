"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>開啟船員檔案</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="船員檔案 · No.07">
        <p style={{ margin: 0 }}>
          座右銘：先求有，再求好，最後求準時下班。
          <br />按 Esc、右上角的 ×，或點彈窗外面都可以關閉；開著的時候 Tab 只會在彈窗裡移動。
        </p>
        <p>
          <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer">
            LinkedIn ↗
          </a>
        </p>
      </Modal>
    </>
  );
}
