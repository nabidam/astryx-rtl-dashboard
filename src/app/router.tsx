import { useEffect } from "react";
import { Text } from "@astryxdesign/core";
import { createBrowserRouter } from "react-router";
import { RtlProbe } from "./shell/RtlProbe";

export function RouterRoot() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "fa";
  }, []);

  return <Text as="p">اسکلت داشبورد آماده است</Text>;
}

export const router = createBrowserRouter([
  {
    path: "/__rtl-spike",
    element: <RtlProbe />,
  },
  {
    path: "*",
    element: <RouterRoot />,
  },
]);
