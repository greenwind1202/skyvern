import { artifactApiBaseUrl } from "@/util/env";
import { useWorkflowRunQuery } from "../hooks/useWorkflowRunQuery";

function WorkflowRunRecording() {
  const { data: workflowRun } = useWorkflowRunQuery();
  const recordingURL = workflowRun?.recording_url
    ? `${artifactApiBaseUrl}/artifact/recording?path=${workflowRun.recording_url.slice(7)}`
    : null;
  return recordingURL ? (
    <video src={recordingURL} controls className="w-full rounded-md" />
  ) : (
    <div>No recording available for this workflow</div>
  );
}

export { WorkflowRunRecording };
