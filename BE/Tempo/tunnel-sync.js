const { spawn } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lrtudzxzytqwhhiiszun.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7TDL7BAku8jkwBtYBfHT1A_yXSQ7o2F';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('========================================================');
console.log('   TEMPO CLOUDFLARE TUNNEL & AUTO SUPABASE SYNC');
console.log('========================================================');

const cloudflared = spawn('.\\cloudflared.exe', ['tunnel', '--protocol', 'http2', '--url', 'http://localhost:5050'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let isSynced = false;

async function syncToSupabase(url) {
  if (isSynced) return;
  isSynced = true;
  const apiUrl = url + '/api';
  console.log('\n[TUNNEL DETECTED]:', url);
  console.log('[SYNCING TO SUPABASE]:', apiUrl);
  
  try {
    const { data, error } = await supabase.from('playlists').upsert({
      id: '00000000-0000-0000-0000-000000000099',
      user_id: 'bdf7cb30-0ae2-47fa-865e-f3ab1abc8263',
      name: '__TEMPO_ACTIVE_SERVER__',
      description: apiUrl
    }).select();
    
    if (error) {
      console.error('[SUPABASE SYNC ERROR]:', error.message);
    } else {
      console.log('========================================================');
      console.log('>>> SUCCESS: URL DA DONG BO LEN SUPABASE CHO DIEN THOAI!');
      console.log('>>> Mobile App se tu dong ket noi vao link:', apiUrl);
      console.log('========================================================\n');
    }
  } catch (err) {
    console.error('[SUPABASE SYNC EXCEPTION]:', err.message);
  }
}

function handleData(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (match && !isSynced) {
    syncToSupabase(match[0]);
  }
}

cloudflared.stdout.on('data', handleData);
cloudflared.stderr.on('data', handleData);

cloudflared.on('close', (code) => {
  console.log('Cloudflared exited with code ' + code);
});
