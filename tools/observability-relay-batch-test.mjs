import assert from "node:assert/strict";
import handler from "./observability-relay/api/batch.js";

const originalFetch=globalThis.fetch;
const originalToken=process.env.GITHUB_TOKEN;
let written=null,writeCalls=0;
process.env.GITHUB_TOKEN="fixture-token";
globalThis.fetch=async function(url,init){
  const method=String(init&&init.method||"GET").toUpperCase();
  if(method==="GET")return{ok:false,status:404,text:async()=>'{"message":"Not Found"}'};
  if(method==="PUT"){
    writeCalls++;
    const payload=JSON.parse(init.body);
    written=JSON.parse(Buffer.from(payload.content,"base64").toString("utf8").trim());
    return{ok:true,status:201,text:async()=>JSON.stringify({content:{sha:"blob-fixture"},commit:{sha:"commit-fixture"}})};
  }
  throw new Error("Unexpected method "+method+" "+url);
};
try{
  const before=Date.now();
  const batch={
    schema:"signal-interpreter-observation-batch/v1",
    batchId:"batch-relay-receipt-fixture",
    createdAt:new Date(before-90000).toISOString(),
    extensionVersion:"0.10.39",
    trigger:"call-lifecycle",
    events:[{id:"event-1",timestamp:new Date(before-91000).toISOString(),action:"INCOMING_RING_SIGNAL"}]
  };
  let statusCode=0,responseBody=null;
  const response={
    status(code){statusCode=code;return this;},
    json(value){responseBody=value;return this;},
    end(){return this;},
    setHeader(){}
  };
  await handler({method:"POST",body:batch},response);
  const after=Date.now();
  assert.equal(statusCode,200);
  assert.equal(responseBody.accepted,true);
  assert.equal(responseBody.duplicate,false);
  assert.ok(Date.parse(responseBody.relayReceivedAt)>=before&&Date.parse(responseBody.relayReceivedAt)<=after);
  assert.ok(written&&written.relayReceivedAt===responseBody.relayReceivedAt,"persisted batch must include the trusted ingress time");
  assert.equal(written.batchId,batch.batchId);
  assert.equal(writeCalls,1);
  console.log("OBSERVABILITY_RELAY_BATCH_TEST=PASS",responseBody.relayReceivedAt);
}finally{
  globalThis.fetch=originalFetch;
  if(originalToken===undefined)delete process.env.GITHUB_TOKEN;else process.env.GITHUB_TOKEN=originalToken;
}
