// INPUT: useLanguage、svgChartToPng.downloadSvgChartAsPng、一个指向星盘容器的 ref。
// OUTPUT: <DownloadChartButton> —— 把容器内的 <svg> 星盘导出为 PNG 下载（含 working/done/error 态）。
// POS: 星盘结果页复用的"下载图片"控件（取代旧的保存到账户按钮）。若更新此文件，务必更新本头注释与所属 FOLDER.md。

import React, { useState } from "react";
import { ActionButton, useLanguage } from "./UIComponents";
import { downloadSvgChartAsPng } from "../utils/svgChartToPng";

interface DownloadChartButtonProps {
  // 指向包裹星盘 <svg> 的容器元素，点击时从中取出 svg 导出。
  containerRef: React.RefObject<HTMLElement | null>;
  filename: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
}

type Status = "idle" | "working" | "done" | "error";

const DownloadChartButton: React.FC<DownloadChartButtonProps> = ({
  containerRef,
  filename,
  size = "sm",
  variant = "secondary",
  className,
}) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const s = t.saved;

  const handleClick = async () => {
    if (status === "working") return;
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) {
      setStatus("error");
      return;
    }
    setStatus("working");
    try {
      await downloadSvgChartAsPng(svg as SVGSVGElement, filename);
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  const label =
    status === "working"
      ? s?.downloading || "Generating…"
      : status === "done"
        ? s?.download_done || "Downloaded"
        : status === "error"
          ? s?.download_error || "Couldn't generate image. Please try again."
          : s?.download || "Download image";

  return (
    <ActionButton
      size={size}
      variant={variant}
      className={className}
      disabled={status === "working"}
      onClick={handleClick}
      ariaLabel={s?.download || "Download image"}
    >
      {status === "done" ? `✓ ${label}` : label}
    </ActionButton>
  );
};

export default DownloadChartButton;
