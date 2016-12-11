var byteLength = function(str) {
    return(encodeURIComponent(str).replace(/%../g,"x").length);
};

var getFee = function(amount, messageType, message) {
  var fee = 0;

  // xem transfer fee
  if(amount < 20000) {
    fee += 1;
  }else if(amount > 250000) {
    fee += 25;
  }else {
    fee += Math.floor(amount / 1000);
  }

  // message fee
  fee += Math.floor(byteLength(message) / 32) + 1

  return fee;
};

var utf8ToHex = function(str) {
  var hex;
  hex = unescape(encodeURIComponent(str)).split('').map(function(v){
    return ( '0' + v.charCodeAt(0).toString(16) ).slice( -2 )
  }).join('');
  return hex;
};

var getTimeStamp = function() {
  const NEM_EPOCH = Date.UTC(2015, 2, 29, 0, 6, 25, 0);
  return Math.floor((Date.now() / 1000) - (NEM_EPOCH / 1000));
};

var main = function() {
  // 1 クライアントの初期化
  var nemApi = require("nem-api");
  var nis = new nemApi('http://62.75.171.41:7890/'); // Livenet は 7890

  // 2 パブリックキーの取得
  var senderAddress = "NBBNC2-K72UDI-N5HMRA-EUWJ4F-22RZPQ-L2LYON-UDET";
  nis.get('/account/get', {
    'address': senderAddress.replace(/-/g , "")
  }, function(res) {
    var addressInfo = res.body;
    var senderPublicKey = addressInfo["account"]["publicKey"];

    // 3 手数料の計算
    var amount = 10;
    var messageType = 1;
    var message = "Hello!";
    var fee = getFee(amount, messageType, message);

    // 4 メッセージのHex文字列化
    var hexMessage = utf8ToHex(message);

    // 5 タイムスタンプの取得
    var timeStamp = getTimeStamp();
    var deadline = timeStamp + (1 * 60 * 60); // 1時間承認されなければ破棄

    // 6 送金量をmicroXEM表現に変換
    var microAmount = amount * 1000000;
    var microFee = fee * 1000000;

    // 7 ネットワークのバージョン設定
    var isMainnet = true;
    var version = isMainnet ? 1744830465 : -1744830463;

    // 8 署名前トランザクション オブジェクトの作成
    var reciverAddress = "NAPLE5-5ZXP4V-5DPHR5-4BRJVR-YP26TE-MCJCZ3-37W7".replace(/-/g , "");
    var txObj = {
      timeStamp: timeStamp,
      amount: microAmount,
      fee: microFee,
      recipient: reciverAddress,
      type: 257, // transter transaction
      deadline: deadline,
      message: {
        type: 1, // 暗号化なし 1 暗号化あり 2
        payload: hexMessage
      },
      version: version,
      signer: senderPublicKey
    };

    console.log(txObj);

    // 9 リクエストアナウンス情報の作成
    var privateKey = "ひみつ"
    var requestAnnounce = nis.signTX(txObj, privateKey);

    console.log(requestAnnounce);

    // 10 リクエストアナウンスのブロードキャスト
    nis.post('/transaction/announce', requestAnnounce, function(res) {
      console.log(res.body);
    });

  });
};

main();


// nis.get('/account/get', { 'address': reciver }, function(res) {
//     var reciverInfo = res.body;
//     console.log("Reciver Balance: " + reciverInfo["account"]["balance"]);
// });

// var senderPublicKey;
//
// var txObj = {
//   type: 257,
//   version: -1744830463,
//   signer: senderPublicKey
//   timeStamp: 53807993,
//   deadline: 53811593,
//   recipient: 'NAPLE55ZXP4V5DPHR54BRJVRYP26TEMCJCZ337W7',
//   amount: 1000000,
//   fee: 9000000,
//   message: { type: 1, payload: '' },
//   mosaics: null
// };

// var txObj = {
//   'isMultisig': false,
//   'recipient': reciver,
//   'amount': 1, // 送りたい量
//   'message': '',
//   'due': 60 // タイムスタンプを現在の時刻+X秒にする
// }

// var transaction = nis.makeTX(txObj, privateKey);
//
// console.log(transaction);

// nis.doTX(txO, senderPrivateKey, function(res) {
//   var result = res.body;
//   console.log(result);
// });
