
// jQuery.js
import $ from 'jquery';
import TurndownService from 'turndown';
import { marked } from 'marked';
import mermaid from 'mermaid';

window.$      = $;
window.jQuery = $;

window.TurndownService = TurndownService;
window.marked          = marked;
window.mermaid         = mermaid;