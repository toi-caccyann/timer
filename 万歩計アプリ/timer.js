// 1. 画面の部品（HTML要素）をJavaScriptに連れてくる
const timeDisplay = document.getElementById('time-display');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const saveBtn = document.getElementById('save-btn');
const distanceDisplay = document.getElementById('distance-display');
const speedDisplay = document.getElementById('speed-display');
const clearBtn = document.getElementById('clear-btn');
const StorageBtn = document.getElementById('storage-btn');
const historyModal = document.getElementById('history-modal');
const closeModalBtn = document.getElementById('close-modal-btn');

// 2. 記憶スペース（状態を管理する変数）を作る
let seconds = 0;      // 走った秒数を数える箱
let timerId = null;   // タイマーの「予約券」を入れておく箱（最初は空っぽ）
let distance = 0.0;
let lastPosition = null;


// 3. 「スタート」ボタンが押されたときの仕掛け
startBtn.addEventListener('click', () => {
    
    // 💡【重要】もしすでにタイマーが動いていたら、二重に起動しないようにガードする
    if (timerId !== null) {
        return; 
    }

    // 💡1000ミリ秒（1秒）ごとに、中の処理をずっと繰り返す（予約券を発行）
    timerId = setInterval(() => {
        // ① 裏の秒数を1増やす
        seconds++;
        
        // ② 【修正】増えた秒数を「〇分〇秒」の形に整えて画面に表示する
        updateFormatTime();

        // ③ 1秒ごとに速度も再計算
        updateSpeed();
        
    }, 1000); // 1000ミリ秒 ＝ 1秒
});

// 4. 「ストップ」ボタンが押されたときの仕掛け
stopBtn.addEventListener('click', () => {
    
    // もしタイマーが動いていたら（予約券が空っぽじゃなかったら）停止処理をする
    if (timerId !== null) {
        // ブラウザに「この予約番号のタイマーを止めて！」と命令する
        clearInterval(timerId);
        
        // タイマーが止まったので、（変数）を空っぽ（null）に戻す
        timerId = null;
    }
});


// 5. ボタンの代わりに、GPS（位置情報）の変化をリアルタイムに監視する
navigator.geolocation.watchPosition((position) => {
    
    // 💡判定①：タイマーが動いていない（一時停止中やスタート前）なら、移動を無視する
    if (timerId === null) {
        return;
    }

    // 今回スマホが検知した最新の緯度・経度を取得
    const currentLat = position.coords.latitude;
    const currentLon = position.coords.longitude;

    // 💡判定②：もし「前回の位置」が保存されていたら、移動距離を計算する
    if (lastPosition !== null) {
        // 先ほど作った数学の関数を使って、前回の場所から何km動いたかを計算
        const chunkDistance = calculateDistance(
            lastPosition.lat, 
            lastPosition.lon, 
            currentLat, 
            currentLon
        );

        // 総走行距離に、今動いた分の距離を足し算する
        distance = distance + chunkDistance;

        // 画面の距離表示を更新（小数点以下2桁）
        distanceDisplay.textContent = distance.toFixed(2) + ' km';

        // 速度もリアルタイムに再計算して画面を更新
        updateSpeed();
    }

    // 💡次の計測のために、今の位置を「前回の位置」として上書き保存する
    lastPosition = {
        lat: currentLat,
        lon: currentLon
    };

}, (error) => {
    // 位置情報の取得に失敗した場合（GPSがオフのときなど）のエラー処理
    console.error("位置情報の取得に失敗しました:", error);
}, {
    // 💡ランニング用にGPSの計測精度を「最高」に設定するオプション
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
});

// 6. 平均速度を計算して画面に表示する関数
function updateSpeed() {
    if (seconds === 0) {
        return;
    }

    // 【算数の式】(距離 × 3600) ÷ 秒数 で時速を計算する
    const kmlh = (distance * 3600) / seconds;

    // 小数点第1位（0.0の形）に綺麗に整えて、画面に表示する
    speedDisplay.textContent = kmlh.toFixed(1) + ' km/h';
}

// 💡【修正】独立した関数として外に出しました！
// 秒数を「〇分〇秒」の形に整えて画面に表示する関数
function updateFormatTime() {
    // 1. 分を計算する（60で割って、Math.floorで小数点以下を切り捨てる）
    const minutes = Math.floor(seconds / 60);
    
    // 2. 60で割った「余りの秒数」を計算する
    const remainingSeconds = seconds % 60;

    // 3. 画面の表示を書き換える
    if (minutes > 0) {
        // 1分以上のときは「〇分〇秒」と表示する
        timeDisplay.textContent = minutes + '分' + remainingSeconds + '秒';
    } else {
        // 0分のときは、すっきり見せるために「〇秒」だけ表示する
        timeDisplay.textContent = remainingSeconds + '秒';
    }
}


// 7. 「リセット」ボタンが押されたときの仕掛け
clearBtn.addEventListener('click', () => {
    // ① 動いているタイマーを止める（ストップボタンと同じ処理）
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }

    // ② 裏側の記憶データをすべて最初の状態（初期値）に戻す
    seconds = 0;
    distance = 0.0;
    lastPosition = null; // 【おまけ】位置情報もリセット

    // ③ 画面の表示をすべて最初の表示に書き換える
    timeDisplay.textContent = '0秒';
    distanceDisplay.textContent = '0.00 km';
    speedDisplay.textContent = '0.0 km/h';
});

//【数学の公式】2つの緯度・経度から距離（km）を計算する関数
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球の半径 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInKm = R * c; // 計算された距離 (km)
    
    return distanceInKm;
}

// 8. 「保存」ボタンが押されたときの仕掛け
saveBtn.addEventListener('click', () => {
    if (seconds === 0) {
        alert("ランニング記録がありません");
        return;
    }

    if (timerId !== null) {
        alert('ストップボタンを押してから保存してください'); 
        return;
    }

    // アラートで出す走行時間を「〇分〇秒」の綺麗な形にする
    const minutes = Math.floor(seconds / 60); //分
    const remainingSeconds = seconds % 60; //秒
    let timeString = "";
    if (minutes > 0) {
        timeString = minutes + '分' + remainingSeconds + '秒';
    } else {
        timeString = remainingSeconds + '秒';
    }

    const currentSpeed = speedDisplay.textContent;
    const currentDistance = distance.toFixed(2) + ' km'; // 小数点2桁に固定

    alert(`ランニング記録を保存しました！
【走行時間】${timeString}
【走行距離】${currentDistance}
【平均速度】${currentSpeed}`);
});

// 9. 「履歴を見る」ボタンが押されたら、ポップアップを表示する
StorageBtn.addEventListener('click', () => {
    //CSSの非表示（none）を、表示（flex）に書き換えて画面に出現させる
    historyModal.style.display = 'flex';
});

// 10. ポップアップの中の「閉じる」ボタンが押されたら、非表示に戻す
closeModalBtn.addEventListener('click', () => {
    //再び非表示（none）にして、画面から隠す
    historyModal.style.display = 'none';
});

