import { speakLatin, speakEnglish, stopSpeech } from "~/engine/speech";
export interface AudioLoopItem { text: string; language: "latin" | "english" }
export interface AudioLoopConfig { items: (string | AudioLoopItem)[]; includeEnglish?: boolean; repeatEach?:number; pauseBetweenMs?:number; loopForever?:boolean; lang?:string; rate?:number }
export interface AudioLoopState { playing:boolean; currentItemIndex:number; currentRepeat:number; language?: "latin" | "english" }
export function createAudioLoop(config:AudioLoopConfig) {
 const repeat=Math.max(1,config.repeatEach??3),pause=Math.max(0,config.pauseBetweenMs??800);
 const items=config.items.map(i=>typeof i==="string"?({text:i,language:"latin" as const}):i); let state:AudioLoopState={playing:false,currentItemIndex:0,currentRepeat:0};let timer:number|undefined;const listeners=new Set<(s:AudioLoopState)=>void>();const emit=()=>listeners.forEach(cb=>cb({...state}));
 const stop=()=>{stopSpeech();if(timer)window.clearTimeout(timer);timer=undefined;state={...state,playing:false,currentRepeat:0,language:undefined};emit()};
 const speak=()=>{if(!state.playing||!items.length)return;const item=items[state.currentItemIndex];state.currentRepeat++;state.language=item.language;emit();if(item.language==="english")speakEnglish(item.text);else speakLatin(item.text);const done=()=>{if(!state.playing)return;if(state.currentRepeat<repeat){timer=window.setTimeout(speak,pause);return}if(state.currentItemIndex+1<items.length){state.currentItemIndex++;state.currentRepeat=0;timer=window.setTimeout(speak,pause)}else if(config.loopForever){state.currentItemIndex=0;state.currentRepeat=0;timer=window.setTimeout(speak,pause)}else{state.playing=false;state.currentRepeat=0;emit()}};const poll=()=>{if(!state.playing)return;if(!window.speechSynthesis.speaking)done();else timer=window.setTimeout(poll,80)};timer=window.setTimeout(poll,100)};
 return {start:()=>{if(typeof window==="undefined"||!items.length)return;stop();state={playing:true,currentItemIndex:0,currentRepeat:0};emit();speak()},stop,getState:()=>({...state}),onStateChange:(cb:(s:AudioLoopState)=>void)=>{listeners.add(cb);return()=>listeners.delete(cb)}};
}
