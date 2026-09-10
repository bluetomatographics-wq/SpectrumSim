// A small GIF89a encoder with a fixed 256-color palette. Frequent clear codes
// keep the LZW stream at nine bits and bound memory while exporting locally.
export class GifEncoder {
  private chunks: Uint8Array[] = [];
  private finished = false;
  constructor(private width: number, private height: number) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 65535 || height > 65535) throw new Error('Invalid GIF dimensions');
    const palette: number[] = [];
    for (let i=0;i<256;i++) palette.push(Math.round((i>>5)*255/7),Math.round(((i>>2)&7)*255/7),Math.round((i&3)*255/3));
    this.chunks.push(new Uint8Array([
      71,73,70,56,57,97,width&255,width>>8,height&255,height>>8,247,0,0,...palette,
      33,255,11,78,69,84,83,67,65,80,69,50,46,48,3,1,0,0,0,
    ]));
  }
  addFrame(rgba: Uint8ClampedArray, delayMs: number) {
    if (this.finished || rgba.length !== this.width*this.height*4) throw new Error('Invalid GIF frame');
    const delay = Math.max(2,Math.min(65535,Math.round(delayMs/10)));
    const pixels = rgba.length/4;
    const packed = new Uint8Array(Math.ceil((pixels+Math.ceil(pixels/250)+2)*9/8));
    let offset=0,bits=0,accumulator=0;
    const code = (value:number) => {
      accumulator |= value<<bits; bits+=9;
      while(bits>=8){packed[offset++]=accumulator&255;accumulator>>>=8;bits-=8;}
    };
    for(let p=0;p<pixels;p++) {
      if(p%250===0)code(256);
      const i=p*4, alpha=rgba[i+3]/255;
      const r=Math.round((rgba[i]*alpha+17*(1-alpha))*7/255);
      const g=Math.round((rgba[i+1]*alpha+20*(1-alpha))*7/255);
      const b=Math.round((rgba[i+2]*alpha+19*(1-alpha))*3/255);
      code((r<<5)|(g<<2)|b);
    }
    code(257);if(bits)packed[offset++]=accumulator&255;
    const header = new Uint8Array([33,249,4,4,delay&255,delay>>8,0,0,44,0,0,0,0,this.width&255,this.width>>8,this.height&255,this.height>>8,0,8]);
    const blocks = new Uint8Array(offset+Math.ceil(offset/255)+1);
    let written=0;
    for(let i=0;i<offset;i+=255){const count=Math.min(255,offset-i);blocks[written++]=count;blocks.set(packed.subarray(i,i+count),written);written+=count;}
    this.chunks.push(header,blocks);
  }
  finish() {
    if (this.finished) throw new Error('GIF already finished');
    this.finished=true;
    const length=this.chunks.reduce((sum,chunk)=>sum+chunk.length,1);
    const result=new Uint8Array(length);let offset=0;
    for(const chunk of this.chunks){result.set(chunk,offset);offset+=chunk.length;}
    result[offset]=59;this.chunks=[];return result;
  }
}
