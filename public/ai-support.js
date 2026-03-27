    (function () {
        if (window.__afAiSupportLoaded) return;
        window.__afAiSupportLoaded = true;

        var afAiSupportEnabled = true;
        if (!afAiSupportEnabled) {
            return;
        }

        function apiEndpoint(path) {
            var base = (window.afAiApiBase || '').replace(/\/+$/, '');
            return base ? (base + path) : path;
        }

        function assetEndpoint(path) {
            var base = (window.appBaseUrl || '').replace(/\/+$/, '');
            return base ? (base + path) : path;
        }

        function esc(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        function linkify(text) {
            var safe = esc(text);
            return safe.replace(/(https?:\/\/[^\s<]+)/g, function (url) {
                return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" style="color:#a5f3fc;text-decoration:underline;">' + url + '</a>';
            });
        }

        function normalizeCardPriceText(text) {
            var safe = String(text || '');
            return safe.replace(/(\d[\d,]*)\.00\b/g, '$1');
        }

        var css = [
            '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");',

            /* ── Toggle Button ── */
            '.af-ai-btn{position:fixed;left:20px;bottom:26px;z-index:9999;border:0;background:transparent;padding:0;width:90px;height:90px;cursor:pointer;}',
            '.af-ai-btn-cloud{position:relative;width:90px;height:90px;border-radius:28px;background:transparent;border:0;box-shadow:none;display:flex;align-items:center;justify-content:center;animation:afFloat 3.4s ease-in-out infinite;}',
            '.af-ai-btn-main{width:70px;height:82px;border-radius:0;object-fit:contain;display:block;background:transparent;border:0;box-shadow:none;position:relative;z-index:1;animation:afWave 1.9s ease-in-out infinite;transform-origin:60% 78%;}',
            '.af-ai-btn-robot{position:absolute;right:-6px;top:-10px;width:36px;height:28px;border-radius:14px;object-fit:contain;background:#fff;border:2px solid #c7d7fe;box-shadow:0 8px 20px rgba(79,70,229,.25);z-index:3;padding:2px 4px;}',
            '.af-ai-btn-robot::after{content:"";position:absolute;left:9px;bottom:-5px;width:10px;height:10px;background:#fff;border-right:2px solid #c7d7fe;border-bottom:2px solid #c7d7fe;transform:rotate(45deg);}',
            '.af-ai-btn:hover .af-ai-btn-main{animation-duration:1.4s;}',
            '@keyframes afWave{0%{transform:rotate(0deg)}8%{transform:rotate(-13deg)}16%{transform:rotate(12deg)}24%{transform:rotate(-10deg)}32%{transform:rotate(8deg)}40%{transform:rotate(0deg)}100%{transform:rotate(0deg)}}',
            '@keyframes afFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}',

            /* ── Panel ── */
            '.af-ai-panel{',
            '  position:fixed;left:18px;bottom:126px;',
            '  width:370px;max-width:calc(100vw - 20px);height:580px;max-height:74vh;',
            '  background:#ffffff;',
            '  border:1px solid rgba(99,102,241,.12);',
            '  border-radius:24px;',
            '  z-index:9999;display:none;',
            '  box-shadow:0 32px 64px rgba(15,23,42,.18), 0 0 0 1px rgba(255,255,255,.6);',
            '  overflow:hidden;flex-direction:column;',
            '  font-family:"Inter",system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;',
            '  animation:afSlideUp .22s cubic-bezier(.16,1,.3,1);',
            '}',
            '@keyframes afSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}',

            /* ── Header ── */
            '.af-ai-head{',
            '  background:linear-gradient(135deg,#4f46e5 0%,#6366f1 50%,#818cf8 100%);',
            '  color:#fff;padding:14px 16px 14px 16px;',
            '  display:flex;align-items:center;justify-content:space-between;gap:10px;',
            '  position:relative;overflow:hidden;',
            '}',
            '.af-ai-head::before{content:"";position:absolute;top:-30px;right:-30px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.07);pointer-events:none;}',
            '.af-ai-head::after{content:"";position:absolute;bottom:-20px;left:40px;width:70px;height:70px;border-radius:50%;background:rgba(255,255,255,.05);pointer-events:none;}',
            '.af-ai-head-left{display:flex;align-items:center;gap:10px;min-width:0;position:relative;z-index:1;}',
            '.af-ai-head-logo-wrap{',
            '  width:36px;height:36px;border-radius:10px;',
            '  background:rgba(255,255,255,.15);',
            '  backdrop-filter:blur(8px);',
            '  border:1px solid rgba(255,255,255,.25);',
            '  display:flex;align-items:center;justify-content:center;',
            '  box-shadow:0 4px 12px rgba(0,0,0,.15);',
            '}',
            '.af-ai-head-logo{width:24px;height:24px;object-fit:contain;border-radius:6px;}',
            '.af-ai-head-info{display:flex;flex-direction:column;gap:1px;}',
            '.af-ai-head-title{font-size:15px;font-weight:700;line-height:1.2;white-space:nowrap;letter-spacing:-.2px;}',
            '.af-ai-head-status{font-size:11px;font-weight:500;color:rgba(255,255,255,.75);display:flex;align-items:center;gap:4px;}',
            '.af-ai-status-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 2px rgba(74,222,128,.3);animation:afPulse 2s ease infinite;}',
            '@keyframes afPulse{0%,100%{box-shadow:0 0 0 2px rgba(74,222,128,.3)}50%{box-shadow:0 0 0 4px rgba(74,222,128,.15)}}',
            '.af-ai-close-btn{',
            '  position:relative;z-index:1;',
            '  border:0;background:rgba(255,255,255,.15);',
            '  color:#fff;',
            '  width:30px;height:30px;border-radius:8px;',
            '  display:flex;align-items:center;justify-content:center;',
            '  cursor:pointer;font-size:18px;line-height:1;',
            '  backdrop-filter:blur(8px);',
            '  border:1px solid rgba(255,255,255,.2);',
            '  transition:background .15s;',
            '}',
            '.af-ai-close-btn:hover{background:rgba(255,255,255,.25);}',

            /* ── Body ── */
            '.af-ai-body{',
            '  flex:1 1 auto;min-height:0;overflow:auto;',
            '  padding:16px;',
            '  background:#f8fafc;',
            '  display:flex;flex-direction:column;gap:2px;',
            '}',
            '.af-ai-body::-webkit-scrollbar{width:4px;}',
            '.af-ai-body::-webkit-scrollbar-track{background:transparent;}',
            '.af-ai-body::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px;}',

            /* ── Messages ── */
            '.af-ai-msg{margin:4px 0;display:flex;align-items:flex-end;gap:8px;animation:afMsgIn .18s ease;}',
            '@keyframes afMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}',
            '.af-ai-msg.user{justify-content:flex-end;}',
            '.af-ai-bubble{',
            '  max-width:80%;padding:10px 14px;',
            '  border-radius:18px;',
            '  font-size:13.5px;line-height:1.55;',
            '  white-space:normal;word-break:break-word;overflow-wrap:anywhere;',
            '}',
            '.af-ai-msg.bot .af-ai-bubble{',
            '  background:linear-gradient(135deg,#4f46e5,#6366f1);',
            '  color:#fff;',
            '  border-bottom-left-radius:5px;',
            '  box-shadow:0 4px 14px rgba(79,70,229,.25);',
            '}',
            '.af-ai-msg.user .af-ai-bubble{',
            '  background:#ffffff;',
            '  color:#1e293b;',
            '  border:1px solid #e2e8f0;',
            '  border-bottom-right-radius:5px;',
            '  box-shadow:0 2px 8px rgba(15,23,42,.06);',
            '}',
            '.af-ai-bubble a{color:#a5f3fc;text-decoration:underline;word-break:break-all;}',

            /* ── Bot avatar dot ── */
            '.af-ai-msg.bot .af-ai-avatar{',
            '  width:26px;height:26px;flex-shrink:0;',
            '  border-radius:8px;',
            '  background:linear-gradient(135deg,#4f46e5,#818cf8);',
            '  display:flex;align-items:center;justify-content:center;',
            '  font-size:13px;',
            '  box-shadow:0 2px 8px rgba(79,70,229,.3);',
            '}',

            /* ── Product Cards ── */
            '.af-ai-cards{display:grid;grid-template-columns:1fr;gap:8px;width:100%;}',
            '.af-ai-card{',
            '  display:flex;gap:12px;align-items:flex-start;',
            '  background:#ffffff;',
            '  border:1px solid #e8edf5;',
            '  border-radius:14px;',
            '  padding:10px 12px;',
            '  box-shadow:0 2px 10px rgba(15,23,42,.06);',
            '  text-decoration:none;',
            '  transition:box-shadow .15s,transform .15s;',
            '}',
            '.af-ai-card:hover{box-shadow:0 8px 24px rgba(79,70,229,.14);transform:translateY(-1px);}',
            '.af-ai-card img{width:58px;height:58px;object-fit:cover;border-radius:10px;display:block;flex-shrink:0;}',
            '.af-ai-card-body{min-width:0;display:flex;flex-direction:column;gap:3px;}',
            '.af-ai-card-name{font-size:13px;font-weight:600;line-height:1.3;color:#0f172a;}',
            '.af-ai-card-desc{font-size:11.5px;color:#64748b;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
            '.af-ai-card-price{font-size:13px;color:#4f46e5;font-weight:700;}',

            /* ── Brand Cards ── */
            '.af-ai-brands{display:grid;grid-template-columns:1fr;gap:8px;width:100%;}',
            '.af-ai-brand-card{',
            '  display:flex;align-items:center;justify-content:space-between;',
            '  background:#ffffff;border:1px solid #e8edf5;',
            '  border-radius:12px;padding:10px 14px;',
            '  text-decoration:none;color:inherit;',
            '  box-shadow:0 2px 8px rgba(15,23,42,.05);',
            '  transition:box-shadow .15s,transform .15s;',
            '}',
            '.af-ai-brand-card:hover{box-shadow:0 6px 18px rgba(79,70,229,.12);transform:translateY(-1px);}',
            '.af-ai-brand-name{font-size:13px;font-weight:600;color:#0f172a;}',
            '.af-ai-brand-count{font-size:11.5px;color:#6366f1;font-weight:600;background:#ede9fe;padding:2px 8px;border-radius:999px;}',
            '.af-ai-brand-wrap{display:flex;flex-direction:column;gap:10px;width:100%;}',
            '.af-ai-brand-footer{padding-top:4px;}',
            '.af-ai-brand-viewall{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#4f46e5;text-decoration:none;font-weight:600;}',
            '.af-ai-brand-viewall:hover{text-decoration:underline;}',

            /* ── Quick Replies ── */
            '.af-ai-quick{',
            '  flex:0 0 auto;padding:10px 12px 8px;',
            '  background:#ffffff;',
            '  border-top:1px solid #f1f5f9;',
            '  display:flex;gap:6px;flex-wrap:wrap;',
            '  max-height:100px;overflow:auto;',
            '}',
            '.af-ai-quick::-webkit-scrollbar{height:0;width:0;}',
            '.af-ai-qbtn{',
            '  border:1.5px solid #e0e7ff;',
            '  background:#f5f3ff;',
            '  color:#4f46e5;',
            '  padding:6px 12px;',
            '  border-radius:999px;',
            '  font-size:11.5px;font-weight:600;',
            '  cursor:pointer;',
            '  transition:background .15s,border-color .15s,box-shadow .15s;',
            '  white-space:nowrap;',
            '}',
            '.af-ai-qbtn:hover{background:#ede9fe;border-color:#c4b5fd;box-shadow:0 2px 8px rgba(99,102,241,.15);}',

            /* ── Footer ── */
            '.af-ai-foot{',
            '  flex:0 0 auto;',
            '  border-top:1px solid #f1f5f9;',
            '  padding:10px 12px;',
            '  background:#ffffff;',
            '  display:flex;gap:8px;align-items:center;',
            '}',
            '.af-ai-input{',
            '  flex:1;',
            '  border:1.5px solid #e2e8f0;',
            '  border-radius:12px;',
            '  padding:10px 14px;',
            '  font-size:13.5px;',
            '  font-family:inherit;',
            '  outline:none;',
            '  background:#f8fafc;',
            '  color:#1e293b;',
            '  transition:border-color .15s,box-shadow .15s,background .15s;',
            '}',
            '.af-ai-input::placeholder{color:#94a3b8;}',
            '.af-ai-input:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(129,140,248,.2);background:#fff;}',
            '.af-ai-send{',
            '  border:0;',
            '  background:linear-gradient(135deg,#4f46e5,#6366f1);',
            '  color:#fff;',
            '  border-radius:12px;',
            '  width:40px;height:40px;',
            '  display:flex;align-items:center;justify-content:center;',
            '  flex-shrink:0;',
            '  cursor:pointer;',
            '  box-shadow:0 4px 12px rgba(79,70,229,.35);',
            '  transition:transform .15s,box-shadow .15s;',
            '}',
            '.af-ai-send:hover{transform:scale(1.05);box-shadow:0 6px 18px rgba(79,70,229,.45);}',
            '.af-ai-send:active{transform:scale(.97);}',
            '.af-ai-send svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}',

            /* ── Responsive ── */
            '@media (max-width:576px){',
            '  .af-ai-panel{right:10px;left:10px;bottom:106px;width:auto;height:70vh;}',
            '  .af-ai-btn{left:10px;bottom:20px;}',
            '}',
        ].join('');

        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        var panel = document.createElement('div');
        panel.className = 'af-ai-panel';
        panel.innerHTML =
            '<div class="af-ai-head">' +
            '  <div class="af-ai-head-left">' +
            '    <div class="af-ai-head-logo-wrap">' +
            '      <img class="af-ai-head-logo" src="' + esc(assetEndpoint('/Image/af.png')) + '" alt="AF">' +
            '    </div>' +
            '    <div class="af-ai-head-info">' +
            '      <span class="af-ai-head-title"><span style="color:#fbbf24;">A</span><span style="color:#a5f3fc;">F</span>Shop AI</span>' +
            '      <span class="af-ai-head-status"><span class="af-ai-status-dot"></span>Online now</span>' +
            '    </div>' +
            '  </div>' +
            '  <button type="button" id="afAiClose" class="af-ai-close-btn" aria-label="Close">' +
            '    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '  </button>' +
            '</div>' +
            '<div id="afAiBody" class="af-ai-body"></div>' +
            '<div id="afAiQuick" class="af-ai-quick"></div>' +
            '<div class="af-ai-foot">' +
            '  <input id="afAiInput" class="af-ai-input" placeholder="Type your question..." autocomplete="off" />' +
            '  <button id="afAiSend" class="af-ai-send" type="button" aria-label="Send">' +
            '    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
            '  </button>' +
            '</div>';
        document.body.appendChild(panel);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'af-ai-btn';
        btn.id = 'afAiToggle';
        btn.innerHTML =
            '<span class="af-ai-btn-cloud">' +
            '<img class="af-ai-btn-main" src="' + esc(assetEndpoint('/Image/sir.png')) + '" alt="AI">' +
            '<img class="af-ai-btn-robot" src="' + esc(assetEndpoint('/Image/af.png')) + '" alt="Support">' +
            '</span>';
        document.body.appendChild(btn);

        var body = panel.querySelector('#afAiBody');
        var input = panel.querySelector('#afAiInput');
        var send = panel.querySelector('#afAiSend');
        var quick = panel.querySelector('#afAiQuick');
        var storageKey = 'af_ai_support_history_v1';
        var uiState = { messages: [], quickReplies: [] };
        var starterQuestions = [
            'What products match a minimalist style?',
            'Suggest items under PHP 5,000.',
            'What is best for office setup at home?',
            'What is the highest-rated product?',
            'What items are low in stock?',
            'Show me trending home decor.',
            'What if I received the wrong item?',
            'Do you accept GCash or online banking?',
            'How can I track my order?',
            'What happens if my item arrives damaged?',
            'What courier do you use?',
            'Can you recommend a sofa for small spaces?',
            'What are your best-selling living room products?',
            'Do you have items on sale right now?'
        ];

        function persistState() {
            try {
                window.sessionStorage.setItem(storageKey, JSON.stringify(uiState));
            } catch (e) {}
        }

        function restoreState() {
            try {
                var raw = window.sessionStorage.getItem(storageKey);
                if (!raw) return;
                var parsed = JSON.parse(raw);
                if (!parsed || !Array.isArray(parsed.messages)) return;
                uiState.messages = parsed.messages;
                uiState.quickReplies = Array.isArray(parsed.quickReplies) ? parsed.quickReplies : [];
            } catch (e) {}
        }

        function addMsg(type, text) {
            var row = document.createElement('div');
            row.className = 'af-ai-msg ' + type;
            if (type === 'bot') {
                row.innerHTML = '<div class="af-ai-avatar">✦</div><div class="af-ai-bubble">' + linkify(text) + '</div>';
            } else {
                row.innerHTML = '<div class="af-ai-bubble">' + linkify(text) + '</div>';
            }
            body.appendChild(row);
            body.scrollTop = body.scrollHeight;
            uiState.messages.push({ kind: 'text', role: type, text: String(text || '') });
            persistState();
        }

        function addProductCards(cards) {
            var list = Array.isArray(cards) ? cards : [];
            if (!list.length) return;
            var row = document.createElement('div');
            row.className = 'af-ai-msg bot';

            var html = '<div class="af-ai-cards">';
            list.slice(0, 10).forEach(function (card) {
                var image = esc(card && card.image ? card.image : '');
                var name = esc(card && card.name ? card.name : 'Product');
                var price = esc(normalizeCardPriceText(card && card.price ? card.price : ''));
                var desc = esc(card && card.description ? card.description : '');
                var url = esc(card && card.url ? card.url : '#');
                html += '<a class="af-ai-card" href="' + url + '">' +
                    '<img src="' + image + '" alt="' + name + '">' +
                    '<div class="af-ai-card-body"><div class="af-ai-card-name">' + name + '</div>' +
                    (desc ? '<div class="af-ai-card-desc">' + desc + '</div>' : '') +
                    (price ? '<div class="af-ai-card-price">₱' + price + '</div>' : '') + '</div>' +
                    '</a>';
            });
            html += '</div>';
            row.innerHTML = html;
            body.appendChild(row);
            body.scrollTop = body.scrollHeight;
            uiState.messages.push({ kind: 'cards', cards: list.slice(0, 10) });
            persistState();
        }

        function addBrandCards(cards, viewAllUrl) {
            var list = Array.isArray(cards) ? cards : [];
            if (!list.length) return;
            var row = document.createElement('div');
            row.className = 'af-ai-msg bot';
            var html = '<div class="af-ai-brand-wrap"><div class="af-ai-brands">';
            list.slice(0, 10).forEach(function (card) {
                var name = esc(card && card.name ? card.name : 'Brand');
                var count = parseInt(card && card.count ? card.count : 0, 10);
                var countText = count > 0 ? (count + ' products') : '';
                var url = esc(card && card.url ? card.url : '#');
                html += '<a class="af-ai-brand-card" href="' + url + '">' +
                    '<div class="af-ai-brand-name">' + name + '</div>' +
                    '<div class="af-ai-brand-count">' + esc(countText) + '</div>' +
                    '</a>';
            });
            html += '</div>';
            if (viewAllUrl) {
                html += '<div class="af-ai-brand-footer"><a class="af-ai-brand-viewall" href="' + esc(viewAllUrl) + '">View all brands →</a></div>';
            }
            html += '</div>';
            row.innerHTML = html;
            body.appendChild(row);
            body.scrollTop = body.scrollHeight;
            uiState.messages.push({ kind: 'brand_cards', cards: list.slice(0, 10), viewAllUrl: viewAllUrl || '' });
            persistState();
        }

        function setQuickReplies(items) {
            quick.innerHTML = '';
            var limited = (items || []).slice(0, 14);
            limited.forEach(function (it) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'af-ai-qbtn';
                b.textContent = it;
                b.addEventListener('click', function () {
                    input.value = it;
                    doSend();
                });
                quick.appendChild(b);
            });
            uiState.quickReplies = limited;
            persistState();
        }

        function renderTextMessage(role, text) {
            var row = document.createElement('div');
            row.className = 'af-ai-msg ' + role;
            if (role === 'bot') {
                row.innerHTML = '<div class="af-ai-avatar">✦</div><div class="af-ai-bubble">' + linkify(text) + '</div>';
            } else {
                row.innerHTML = '<div class="af-ai-bubble">' + linkify(text) + '</div>';
            }
            body.appendChild(row);
        }

        function renderCards(cards) {
            var list = Array.isArray(cards) ? cards : [];
            if (!list.length) return;
            var row = document.createElement('div');
            row.className = 'af-ai-msg bot';
            var html = '<div class="af-ai-cards">';
            list.slice(0, 10).forEach(function (card) {
                var image = esc(card && card.image ? card.image : '');
                var name = esc(card && card.name ? card.name : 'Product');
                var price = esc(normalizeCardPriceText(card && card.price ? card.price : ''));
                var desc = esc(card && card.description ? card.description : '');
                var url = esc(card && card.url ? card.url : '#');
                html += '<a class="af-ai-card" href="' + url + '">' +
                    '<img src="' + image + '" alt="' + name + '">' +
                    '<div class="af-ai-card-body"><div class="af-ai-card-name">' + name + '</div>' +
                    (desc ? '<div class="af-ai-card-desc">' + desc + '</div>' : '') +
                    (price ? '<div class="af-ai-card-price">₱' + price + '</div>' : '') + '</div>' +
                    '</a>';
            });
            html += '</div>';
            row.innerHTML = html;
            body.appendChild(row);
        }

        function renderBrandCards(cards, viewAllUrl) {
            var list = Array.isArray(cards) ? cards : [];
            if (!list.length) return;
            var row = document.createElement('div');
            row.className = 'af-ai-msg bot';
            var html = '<div class="af-ai-brand-wrap"><div class="af-ai-brands">';
            list.slice(0, 10).forEach(function (card) {
                var name = esc(card && card.name ? card.name : 'Brand');
                var count = parseInt(card && card.count ? card.count : 0, 10);
                var countText = count > 0 ? (count + ' products') : '';
                var url = esc(card && card.url ? card.url : '#');
                html += '<a class="af-ai-brand-card" href="' + url + '">' +
                    '<div class="af-ai-brand-name">' + name + '</div>' +
                    '<div class="af-ai-brand-count">' + esc(countText) + '</div>' +
                    '</a>';
            });
            html += '</div>';
            if (viewAllUrl) {
                html += '<div class="af-ai-brand-footer"><a class="af-ai-brand-viewall" href="' + esc(viewAllUrl) + '">View all brands →</a></div>';
            }
            html += '</div>';
            row.innerHTML = html;
            body.appendChild(row);
        }

        function renderHistory() {
            body.innerHTML = '';
            uiState.messages.forEach(function (m) {
                if (!m || !m.kind) return;
                if (m.kind === 'text') {
                    renderTextMessage(m.role === 'user' ? 'user' : 'bot', m.text || '');
                    return;
                }
                if (m.kind === 'cards') {
                    renderCards(m.cards || []);
                    return;
                }
                if (m.kind === 'brand_cards') {
                    renderBrandCards(m.cards || [], m.viewAllUrl || '');
                }
            });
            if (uiState.quickReplies && uiState.quickReplies.length) {
                setQuickReplies(uiState.quickReplies);
            }
            body.scrollTop = body.scrollHeight;
        }

        function doSend() {
            var msg = (input.value || '').trim();
            if (!msg) return;
            addMsg('user', msg);
            input.value = '';

            fetch(apiEndpoint('/api/ai-support'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: 'message=' + encodeURIComponent(msg)
            })
                .then(function (res) { return res.json(); })
                .then(function (res) {
                    if (res && res.status === 'ok') {
                        addMsg('bot', res.reply || 'I received your message.');
                        addProductCards(res.product_cards || []);
                        addBrandCards(res.brand_cards || [], res.brand_view_all_url || '');
                        setQuickReplies(res.quick_replies || []);
                        return;
                    }
                    addMsg('bot', 'I could not process your request right now.');
                })
                .catch(function () {
                    addMsg('bot', 'Support is temporarily unavailable. Please try again.');
                });
        }

        function openPanel() {
            panel.style.display = 'flex';
            if (!uiState.messages.length) {
                addMsg('bot', 'Hi! How can we help?');
                setQuickReplies(starterQuestions);
            } else {
                renderHistory();
            }
            input.focus();
        }

        function closePanel() {
            panel.style.display = 'none';
        }

        btn.addEventListener('click', function () {
            if (panel.style.display === 'flex') {
                closePanel();
            } else {
                openPanel();
            }
        });

        panel.querySelector('#afAiClose').addEventListener('click', closePanel);
        send.addEventListener('click', doSend);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSend();
            }
        });

        restoreState();
    })();
