"use strict";(()=>{var e={};e.id=4732,e.ids=[4732],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},46422:(e,t,n)=>{n.r(t),n.d(t,{originalPathname:()=>f,patchFetch:()=>g,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>h,staticGenerationAsyncStorage:()=>u});var s={};n.r(s),n.d(s,{POST:()=>l});var o=n(49303),i=n(88716),a=n(60670),r=n(87070);async function l(e){try{let{stockCode:t,companyName:s}=await e.json();if(!t||!s)return r.NextResponse.json({success:!1,error:"Stock code and company name are required."},{status:400});if(!process.env.GEMINI_API_KEY)return r.NextResponse.json({success:!1,error:"Gemini API key is not configured."},{status:500});let{GoogleGenerativeAI:o}=n(62212),i=new o(process.env.GEMINI_API_KEY).getGenerativeModel({model:"gemini-1.5-flash"}),a=`Analyze the investment momentum for ${s} (${t}) for 2025. Provide a concise summary of key bullish and bearish factors, and potential growth areas. Focus on 2025 outlook. Provide the analysis in Korean.`,l=await i.generateContent(a),c=(await l.response).text();return r.NextResponse.json({success:!0,insight:c})}catch(e){return console.error("Error in Gemini insight API route:",e),r.NextResponse.json({success:!1,error:"Internal server error."},{status:500})}}let c=new o.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/gemini-insight/route",pathname:"/api/gemini-insight",filename:"route",bundlePath:"app/api/gemini-insight/route"},resolvedPagePath:"C:\\Users\\hanbi\\OneDrive\\바탕 화면\\my-news-app\\frontend\\app\\api\\gemini-insight\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:u,serverHooks:h}=c,f="/api/gemini-insight/route";function g(){return(0,a.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:u})}},62212:(e,t)=>{var n;t.SchemaType=void 0,function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"}(t.SchemaType||(t.SchemaType={})),/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */t.ExecutableCodeLanguage=void 0,function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"}(t.ExecutableCodeLanguage||(t.ExecutableCodeLanguage={})),t.Outcome=void 0,function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"}(t.Outcome||(t.Outcome={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let s=["user","model","function","system"];t.HarmCategory=void 0,function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"}(t.HarmCategory||(t.HarmCategory={})),t.HarmBlockThreshold=void 0,function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"}(t.HarmBlockThreshold||(t.HarmBlockThreshold={})),t.HarmProbability=void 0,function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"}(t.HarmProbability||(t.HarmProbability={})),t.BlockReason=void 0,function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"}(t.BlockReason||(t.BlockReason={})),t.FinishReason=void 0,function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.OTHER="OTHER"}(t.FinishReason||(t.FinishReason={})),t.TaskType=void 0,function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"}(t.TaskType||(t.TaskType={})),t.FunctionCallingMode=void 0,function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"}(t.FunctionCallingMode||(t.FunctionCallingMode={})),t.DynamicRetrievalMode=void 0,function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"}(t.DynamicRetrievalMode||(t.DynamicRetrievalMode={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class o extends Error{constructor(e){super(`[GoogleGenerativeAI Error]: ${e}`)}}class i extends o{constructor(e,t){super(e),this.response=t}}class a extends o{constructor(e,t,n,s){super(e),this.status=t,this.statusText=n,this.errorDetails=s}}class r extends o{}class l extends o{}!function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"}(n||(n={}));class c{constructor(e,t,n,s,o){this.model=e,this.task=t,this.apiKey=n,this.stream=s,this.requestOptions=o}toString(){var e,t;let n=(null===(e=this.requestOptions)||void 0===e?void 0:e.apiVersion)||"v1beta",s=(null===(t=this.requestOptions)||void 0===t?void 0:t.baseUrl)||"https://generativelanguage.googleapis.com",o=`${s}/${n}/${this.model}:${this.task}`;return this.stream&&(o+="?alt=sse"),o}}async function d(e){var t;let n=new Headers;n.append("Content-Type","application/json"),n.append("x-goog-api-client",function(e){let t=[];return(null==e?void 0:e.apiClient)&&t.push(e.apiClient),t.push("genai-js/0.24.1"),t.join(" ")}(e.requestOptions)),n.append("x-goog-api-key",e.apiKey);let s=null===(t=e.requestOptions)||void 0===t?void 0:t.customHeaders;if(s){if(!(s instanceof Headers))try{s=new Headers(s)}catch(e){throw new r(`unable to convert customHeaders value ${JSON.stringify(s)} to Headers: ${e.message}`)}for(let[e,t]of s.entries()){if("x-goog-api-key"===e)throw new r(`Cannot set reserved header name ${e}`);if("x-goog-api-client"===e)throw new r(`Header name ${e} can only be set using the apiClient field`);n.append(e,t)}}return n}async function u(e,t,n,s,o,i){let a=new c(e,t,n,s,i);return{url:a.toString(),fetchOptions:Object.assign(Object.assign({},function(e){let t={};if((null==e?void 0:e.signal)!==void 0||(null==e?void 0:e.timeout)>=0){let n=new AbortController;(null==e?void 0:e.timeout)>=0&&setTimeout(()=>n.abort(),e.timeout),(null==e?void 0:e.signal)&&e.signal.addEventListener("abort",()=>{n.abort()}),t.signal=n.signal}return t}(i)),{method:"POST",headers:await d(a),body:o})}}async function h(e,t,n,s,o,i={},a=fetch){let{url:r,fetchOptions:l}=await u(e,t,n,s,o,i);return f(r,l,a)}async function f(e,t,n=fetch){let s;try{s=await n(e,t)}catch(t){(function(e,t){let n=e;throw"AbortError"===n.name?(n=new l(`Request aborted when fetching ${t.toString()}: ${e.message}`)).stack=e.stack:e instanceof a||e instanceof r||((n=new o(`Error fetching from ${t.toString()}: ${e.message}`)).stack=e.stack),n})(t,e)}return s.ok||await g(s,e),s}async function g(e,t){let n,s="";try{let t=await e.json();s=t.error.message,t.error.details&&(s+=` ${JSON.stringify(t.error.details)}`,n=t.error.details)}catch(e){}throw new a(`Error fetching from ${t.toString()}: [${e.status} ${e.statusText}] ${s}`,e.status,e.statusText,n)}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function p(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),C(e.candidates[0]))throw new i(`${O(e)}`,e);return function(e){var t,n,s,o;let i=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(let t of null===(o=null===(s=e.candidates)||void 0===s?void 0:s[0].content)||void 0===o?void 0:o.parts)t.text&&i.push(t.text),t.executableCode&&i.push("\n```"+t.executableCode.language+"\n"+t.executableCode.code+"\n```\n"),t.codeExecutionResult&&i.push("\n```\n"+t.codeExecutionResult.output+"\n```\n");return i.length>0?i.join(""):""}(e)}if(e.promptFeedback)throw new i(`Text not available. ${O(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),C(e.candidates[0]))throw new i(`${O(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),E(e)[0]}if(e.promptFeedback)throw new i(`Function call not available. ${O(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),C(e.candidates[0]))throw new i(`${O(e)}`,e);return E(e)}if(e.promptFeedback)throw new i(`Function call not available. ${O(e)}`,e)},e}function E(e){var t,n,s,o;let i=[];if(null===(n=null===(t=e.candidates)||void 0===t?void 0:t[0].content)||void 0===n?void 0:n.parts)for(let t of null===(o=null===(s=e.candidates)||void 0===s?void 0:s[0].content)||void 0===o?void 0:o.parts)t.functionCall&&i.push(t.functionCall);return i.length>0?i:void 0}let m=[t.FinishReason.RECITATION,t.FinishReason.SAFETY,t.FinishReason.LANGUAGE];function C(e){return!!e.finishReason&&m.includes(e.finishReason)}function O(e){var t,n,s;let o="";if((!e.candidates||0===e.candidates.length)&&e.promptFeedback)o+="Response was blocked",(null===(t=e.promptFeedback)||void 0===t?void 0:t.blockReason)&&(o+=` due to ${e.promptFeedback.blockReason}`),(null===(n=e.promptFeedback)||void 0===n?void 0:n.blockReasonMessage)&&(o+=`: ${e.promptFeedback.blockReasonMessage}`);else if(null===(s=e.candidates)||void 0===s?void 0:s[0]){let t=e.candidates[0];C(t)&&(o+=`Candidate was blocked due to ${t.finishReason}`,t.finishMessage&&(o+=`: ${t.finishMessage}`))}return o}function y(e){return this instanceof y?(this.v=e,this):new y(e)}"function"==typeof SuppressedError&&SuppressedError;/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let v=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;async function I(e){let t=[],n=e.getReader();for(;;){let{done:e,value:s}=await n.read();if(e)return p(function(e){let t=e[e.length-1],n={promptFeedback:null==t?void 0:t.promptFeedback};for(let t of e){if(t.candidates){let e=0;for(let s of t.candidates)if(n.candidates||(n.candidates=[]),n.candidates[e]||(n.candidates[e]={index:e}),n.candidates[e].citationMetadata=s.citationMetadata,n.candidates[e].groundingMetadata=s.groundingMetadata,n.candidates[e].finishReason=s.finishReason,n.candidates[e].finishMessage=s.finishMessage,n.candidates[e].safetyRatings=s.safetyRatings,s.content&&s.content.parts){n.candidates[e].content||(n.candidates[e].content={role:s.content.role||"user",parts:[]});let t={};for(let o of s.content.parts)o.text&&(t.text=o.text),o.functionCall&&(t.functionCall=o.functionCall),o.executableCode&&(t.executableCode=o.executableCode),o.codeExecutionResult&&(t.codeExecutionResult=o.codeExecutionResult),0===Object.keys(t).length&&(t.text=""),n.candidates[e].content.parts.push(t)}e++}t.usageMetadata&&(n.usageMetadata=t.usageMetadata)}return n}(t));t.push(s)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _(e,t,s,i){return function(e){let[t,n]=(function(e){let t=e.getReader();return new ReadableStream({start(e){let n="";return function s(){return t.read().then(({value:t,done:i})=>{let a;if(i){if(n.trim()){e.error(new o("Failed to parse stream"));return}e.close();return}let r=(n+=t).match(v);for(;r;){try{a=JSON.parse(r[1])}catch(t){e.error(new o(`Error parsing JSON response: "${r[1]}"`));return}e.enqueue(a),r=(n=n.substring(r[0].length)).match(v)}return s()}).catch(e=>{let t=e;throw t.stack=e.stack,t="AbortError"===t.name?new l("Request aborted when reading from the stream"):new o("Error reading from the stream")})}()}})})(e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0}))).tee();return{stream:function(e){return function(e,t,n){if(!Symbol.asyncIterator)throw TypeError("Symbol.asyncIterator is not defined.");var s,o=n.apply(e,t||[]),i=[];return s={},a("next"),a("throw"),a("return"),s[Symbol.asyncIterator]=function(){return this},s;function a(e){o[e]&&(s[e]=function(t){return new Promise(function(n,s){i.push([e,t,n,s])>1||r(e,t)})})}function r(e,t){try{var n;(n=o[e](t)).value instanceof y?Promise.resolve(n.value.v).then(l,c):d(i[0][2],n)}catch(e){d(i[0][3],e)}}function l(e){r("next",e)}function c(e){r("throw",e)}function d(e,t){e(t),i.shift(),i.length&&r(i[0][0],i[0][1])}}(this,arguments,function*(){let t=e.getReader();for(;;){let{value:e,done:n}=yield y(t.read());if(n)break;yield yield y(p(e))}})}(t),response:I(n)}}(await h(t,n.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(s),i))}async function T(e,t,s,o){let i=await h(t,n.GENERATE_CONTENT,e,!1,JSON.stringify(s),o);return{response:p(await i.json())}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function R(e){if(null!=e){if("string"==typeof e)return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function A(e){let t=[];if("string"==typeof e)t=[{text:e}];else for(let n of e)"string"==typeof n?t.push({text:n}):t.push(n);return function(e){let t={role:"user",parts:[]},n={role:"function",parts:[]},s=!1,i=!1;for(let o of e)"functionResponse"in o?(n.parts.push(o),i=!0):(t.parts.push(o),s=!0);if(s&&i)throw new o("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!s&&!i)throw new o("No content is provided for sending chat message.");return s?t:n}(t)}function N(e){let t;return t=e.contents?e:{contents:[A(e)]},e.systemInstruction&&(t.systemInstruction=R(e.systemInstruction)),t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let S=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],w={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function b(e){var t;if(void 0===e.candidates||0===e.candidates.length)return!1;let n=null===(t=e.candidates[0])||void 0===t?void 0:t.content;if(void 0===n||void 0===n.parts||0===n.parts.length)return!1;for(let e of n.parts)if(void 0===e||0===Object.keys(e).length||void 0!==e.text&&""===e.text)return!1;return!0}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let M="SILENT_ERROR";class x{constructor(e,t,n,i={}){this.model=t,this.params=n,this._requestOptions=i,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=e,(null==n?void 0:n.history)&&(function(e){let t=!1;for(let n of e){let{role:e,parts:i}=n;if(!t&&"user"!==e)throw new o(`First content should be with role 'user', got ${e}`);if(!s.includes(e))throw new o(`Each item should include role field. Got ${e} but valid roles are: ${JSON.stringify(s)}`);if(!Array.isArray(i))throw new o("Content should have 'parts' property with an array of Parts");if(0===i.length)throw new o("Each Content should have at least one part");let a={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(let e of i)for(let t of S)t in e&&(a[t]+=1);let r=w[e];for(let t of S)if(!r.includes(t)&&a[t]>0)throw new o(`Content with role '${e}' can't contain '${t}' part`);t=!0}}(n.history),this._history=n.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(e,t={}){var n,s,o,i,a,r;let l;await this._sendPromise;let c=A(e),d={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(s=this.params)||void 0===s?void 0:s.generationConfig,tools:null===(o=this.params)||void 0===o?void 0:o.tools,toolConfig:null===(i=this.params)||void 0===i?void 0:i.toolConfig,systemInstruction:null===(a=this.params)||void 0===a?void 0:a.systemInstruction,cachedContent:null===(r=this.params)||void 0===r?void 0:r.cachedContent,contents:[...this._history,c]},u=Object.assign(Object.assign({},this._requestOptions),t);return this._sendPromise=this._sendPromise.then(()=>T(this._apiKey,this.model,d,u)).then(e=>{var t;if(b(e.response)){this._history.push(c);let n=Object.assign({parts:[],role:"model"},null===(t=e.response.candidates)||void 0===t?void 0:t[0].content);this._history.push(n)}else{let t=O(e.response);t&&console.warn(`sendMessage() was unsuccessful. ${t}. Inspect response object for details.`)}l=e}).catch(e=>{throw this._sendPromise=Promise.resolve(),e}),await this._sendPromise,l}async sendMessageStream(e,t={}){var n,s,o,i,a,r;await this._sendPromise;let l=A(e),c={safetySettings:null===(n=this.params)||void 0===n?void 0:n.safetySettings,generationConfig:null===(s=this.params)||void 0===s?void 0:s.generationConfig,tools:null===(o=this.params)||void 0===o?void 0:o.tools,toolConfig:null===(i=this.params)||void 0===i?void 0:i.toolConfig,systemInstruction:null===(a=this.params)||void 0===a?void 0:a.systemInstruction,cachedContent:null===(r=this.params)||void 0===r?void 0:r.cachedContent,contents:[...this._history,l]},d=Object.assign(Object.assign({},this._requestOptions),t),u=_(this._apiKey,this.model,c,d);return this._sendPromise=this._sendPromise.then(()=>u).catch(e=>{throw Error(M)}).then(e=>e.response).then(e=>{if(b(e)){this._history.push(l);let t=Object.assign({},e.candidates[0].content);t.role||(t.role="model"),this._history.push(t)}else{let t=O(e);t&&console.warn(`sendMessageStream() was unsuccessful. ${t}. Inspect response object for details.`)}}).catch(e=>{e.message!==M&&console.error(e)}),u}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function P(e,t,s,o){return(await h(t,n.COUNT_TOKENS,e,!1,JSON.stringify(s),o)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function D(e,t,s,o){return(await h(t,n.EMBED_CONTENT,e,!1,JSON.stringify(s),o)).json()}async function G(e,t,s,o){let i=s.requests.map(e=>Object.assign(Object.assign({},e),{model:t}));return(await h(t,n.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:i}),o)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class L{constructor(e,t,n={}){this.apiKey=e,this._requestOptions=n,t.model.includes("/")?this.model=t.model:this.model=`models/${t.model}`,this.generationConfig=t.generationConfig||{},this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=R(t.systemInstruction),this.cachedContent=t.cachedContent}async generateContent(e,t={}){var n;let s=N(e),o=Object.assign(Object.assign({},this._requestOptions),t);return T(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},s),o)}async generateContentStream(e,t={}){var n;let s=N(e),o=Object.assign(Object.assign({},this._requestOptions),t);return _(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(n=this.cachedContent)||void 0===n?void 0:n.name},s),o)}startChat(e){var t;return new x(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:null===(t=this.cachedContent)||void 0===t?void 0:t.name},e),this._requestOptions)}async countTokens(e,t={}){let n=function(e,t){var n;let s={model:null==t?void 0:t.model,generationConfig:null==t?void 0:t.generationConfig,safetySettings:null==t?void 0:t.safetySettings,tools:null==t?void 0:t.tools,toolConfig:null==t?void 0:t.toolConfig,systemInstruction:null==t?void 0:t.systemInstruction,cachedContent:null===(n=null==t?void 0:t.cachedContent)||void 0===n?void 0:n.name,contents:[]},o=null!=e.generateContentRequest;if(e.contents){if(o)throw new r("CountTokensRequest must have one of contents or generateContentRequest, not both.");s.contents=e.contents}else if(o)s=Object.assign(Object.assign({},s),e.generateContentRequest);else{let t=A(e);s.contents=[t]}return{generateContentRequest:s}}(e,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),s=Object.assign(Object.assign({},this._requestOptions),t);return P(this.apiKey,this.model,n,s)}async embedContent(e,t={}){let n="string"==typeof e||Array.isArray(e)?{content:A(e)}:e,s=Object.assign(Object.assign({},this._requestOptions),t);return D(this.apiKey,this.model,n,s)}async batchEmbedContents(e,t={}){let n=Object.assign(Object.assign({},this._requestOptions),t);return G(this.apiKey,this.model,e,n)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class H{constructor(e){this.apiKey=e}getGenerativeModel(e,t){if(!e.model)throw new o("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new L(this.apiKey,e,t)}getGenerativeModelFromCachedContent(e,t,n){if(!e.name)throw new r("Cached content must contain a `name` field.");if(!e.model)throw new r("Cached content must contain a `model` field.");for(let n of["model","systemInstruction"])if((null==t?void 0:t[n])&&e[n]&&(null==t?void 0:t[n])!==e[n]){if("model"===n&&(t.model.startsWith("models/")?t.model.replace("models/",""):t.model)===(e.model.startsWith("models/")?e.model.replace("models/",""):e.model))continue;throw new r(`Different value for "${n}" specified in modelParams (${t[n]}) and cachedContent (${e[n]})`)}let s=Object.assign(Object.assign({},t),{model:e.model,tools:e.tools,toolConfig:e.toolConfig,systemInstruction:e.systemInstruction,cachedContent:e});return new L(this.apiKey,s,n)}}t.ChatSession=x,t.GenerativeModel=L,t.GoogleGenerativeAI=H,t.GoogleGenerativeAIAbortError=l,t.GoogleGenerativeAIError=o,t.GoogleGenerativeAIFetchError=a,t.GoogleGenerativeAIRequestInputError=r,t.GoogleGenerativeAIResponseError=i,t.POSSIBLE_ROLES=s}};var t=require("../../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),s=t.X(0,[8948,5972],()=>n(46422));module.exports=s})();