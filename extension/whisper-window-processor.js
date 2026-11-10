class SignalWhisperWindowProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts=options&&options.processorOptions||{};
    this.windowSeconds=Math.max(1,Math.min(12,Number(opts.windowSeconds)||6));
    this.targetSampleRate=sampleRate;
    this.windowFrames=Math.max(this.targetSampleRate,Math.round(this.targetSampleRate*this.windowSeconds));
    this.samples=new Int16Array(this.windowFrames);
    this.used=0;
    this.startFrame=null;
    this.port.onmessage=(event)=>{
      const message=event&&event.data||{};
      if(message.type==="flush")this.flush();
    };
  }
  encodeWav(count,startFrame,endFrame) {
    const bytes=44+count*2;
    const buffer=new ArrayBuffer(bytes);
    const view=new DataView(buffer);
    const write=(offset,value)=>{for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));};
    write(0,"RIFF");view.setUint32(4,bytes-8,true);write(8,"WAVE");write(12,"fmt ");
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
    view.setUint32(24,this.targetSampleRate,true);view.setUint32(28,this.targetSampleRate*2,true);
    view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,"data");view.setUint32(40,count*2,true);
    for(let i=0;i<count;i++)view.setInt16(44+i*2,this.samples[i],true);
    return {buffer:buffer,startFrame:startFrame,endFrame:endFrame,sampleRate:this.targetSampleRate,frames:count};
  }
  emit(count,endFrame) {
    if(!count||this.startFrame===null)return;
    const packet=this.encodeWav(count,this.startFrame,endFrame);
    this.port.postMessage({type:"window",source:"audio",packet:packet},[packet.buffer]);
    this.used=0;this.startFrame=null;
  }
  flush() {
    if(this.used>0)this.emit(this.used,(this.startFrame||0)+this.used);
    this.port.postMessage({type:"flushed"});
  }
  process(inputs,outputs) {
    const output=outputs&&outputs[0];
    if(output)for(const channel of output)channel.fill(0);
    const input=inputs&&inputs[0];
    if(!input||!input.length||!input[0]||!input[0].length)return true;
    const frameCount=input[0].length;
    for(let i=0;i<frameCount;i++){
      const absoluteFrame=currentFrame+i;
      if(this.startFrame===null)this.startFrame=absoluteFrame;
      let mixed=0;
      for(let c=0;c<input.length;c++)mixed+=Number(input[c][i]||0);
      mixed/=input.length;
      mixed=Math.max(-1,Math.min(1,mixed));
      this.samples[this.used++]=mixed<0?Math.round(mixed*32768):Math.round(mixed*32767);
      if(this.used>=this.windowFrames)this.emit(this.windowFrames,absoluteFrame+1);
    }
    return true;
  }
}
registerProcessor("signal-whisper-window",SignalWhisperWindowProcessor);
