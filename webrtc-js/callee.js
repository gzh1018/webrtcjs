var m_idLocalV = null;
var m_idPeerV = null;
var m_idMySdp = null;
var m_idPeerSdp = null;
var m_idMyIce = null;
var m_idPeerIce = null;

var m_LocalStream = null;
var m_PeerConn = null;

var PUtility = {};
PUtility.PGetCurTime = function() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + date.getHours() + seperator2 + date.getMinutes()
            + seperator2 + date.getSeconds() + seperator2 + date.getMilliseconds();
    return currentdate;
}
//--------------------------------------------------------------------------------
//      不需要处理的打印函数
//--------------------------------------------------------------------------------
    function onCreateOfferError(error)
    {
        console.log(PUtility.PGetCurTime(), "onCreateOfferError:", error);
    }
    function onSetLocalSuccess(sdp)
    {
        console.log(PUtility.PGetCurTime(), "SetLocalSuccess:", sdp);
    }
    function onSetLocalError(error)
    {
        console.log(PUtility.PGetCurTime(), "SetLocalError:", error);
    }
    function onSetRemoteSuccess()
    {
        console.log(PUtility.PGetCurTime(), "SetRemoteSuccess:");
    }

    function onSetRemoteError(error)
    {
        console.log(PUtility.PGetCurTime(), "SetRemoteError:", error);
    }
    function onCreateAnswerError(error)
    {
        console.log(PUtility.PGetCurTime(), "onCreateAnswerError:", error);
    }
    function onIceStateChange(event)
    {
        if (null == m_PeerConn)
            console.log(PUtility.PGetCurTime(), "onIceLocalStateChange:");
        else
            console.log(PUtility.PGetCurTime(), "onIceLocalStateChange:", m_PeerConn.iceConnectionState);
    }

    function onAddIcePeerCandidateSuccess(cand)
    {
        console.log(PUtility.PGetCurTime(), "onAddIcePeerCandidateSuccess:", cand);
    }
    function onAddIcePeerCandidateError(cand, error)
    {
        console.log(PUtility.PGetCurTime(), "onAddIcePeerCandidateError:", cand, error);
    }
    
//--------------------------------------------------------------------------------
//      需要处理的函数
//--------------------------------------------------------------------------------
    //offer创建成功
    onCreateOfferSuccess = function(sdp)
    {
        console.log(PUtility.PGetCurTime(), "onCreateOfferSuccess:", sdp);

        m_PeerConn.setLocalDescription(sdp)
            .then(function() {onSetLocalSuccess(sdp);}, onSetLocalError);
        
        m_idLocalV.srcObject = m_LocalStream;
        
        var strOld = document.getElementById("id_my_sdp").value;
        document.getElementById("id_my_sdp").value = strOld + sdp.sdp;
    }

    function onCreateAnswerSuccess(sdp)
    {
        console.log(PUtility.PGetCurTime(), "onCreateAnswerSuccess:", sdp);

        m_PeerConn.setLocalDescription(sdp)
            .then(function() {SetLocalSuccess(sdp);}, SetLocalError);
    }

    function onIceCandidate(event)
    {
        console.log(PUtility.PGetCurTime(), "onIceCandidate:", event.candidate);
        if (null == event.candidate)
            return;
        var strOld = document.getElementById("id_my_ice").value;
        document.getElementById("id_my_ice").value = strOld + '{"candidate": "' + event.candidate.candidate
            + '","sdpMid": "' + event.candidate.sdpMid
            + '","sdpMLineIndex": ' + event.candidate.sdpMLineIndex + '}';
        return;
    }

    function onTrack(event)
    {
        console.log(PUtility.PGetCurTime(), "onTrack:", event);

        if (m_idPeerV.srcObject !== event.streams[0])
        {
            m_idPeerV.srcObject = event.streams[0];
            console.log(PUtility.PGetCurTime(), "onTrack:", m_idPeerV);
        }
    }


    


GotStream = function(stream)
{
    console.log(PUtility.PGetCurTime(), "Got local stream");
    m_LocalStream = stream;
    
    //初始化 PeerConn
    var servers = { iceServers: [{ 'url': 'stun:47.100.78.154:3478' }, { 'url': 'turn:47.100.78.154:3478', 'credential': '123456', 'username': 'chisj' }]};
    console.log(' ', PUtility.PGetCurTime(), 'self.PeerConn = new RTCPeerConnection()');
    m_PeerConn = new RTCPeerConnection(servers);
    
    var videoTracks = m_LocalStream.getVideoTracks();
    var audioTracks = m_LocalStream.getAudioTracks();

    m_PeerConn.addTrack(audioTracks[0], m_LocalStream);
    m_PeerConn.addTrack(videoTracks[0], m_LocalStream);

    m_PeerConn.onicecandidate = function(event)
    {
        onIceCandidate(event);
    };
    m_PeerConn.oniceconnectionstatechange = function(event)
    {
        onIceStateChange(event);
    };
    m_PeerConn.ontrack = function(event)
    {
        onTrack(event);
    };
    
    m_PeerConn.createOffer().then(
        onCreateOfferSuccess, onCreateOfferError);
  
}

// 启动
function fn_Start()
{
    m_idLocalV  = id_video_my;
    m_idPeerV   = id_video_peer;
    m_idMySdp   = id_my_sdp;
    m_idPeerSdp = id_peer_sdp;
    m_idMyIce   = id_my_ice;
    m_idPeerIce = id_peer_ice;

    //启动本地
    navigator.mediaDevices.getUserMedia({audio: true, video: true})
        .then(self.GotStream)
        .catch(function(e)
        {
            alert("getUserMedia() error: " + e.name);
        });
}

function fn_PeerSdp()
{
    var strPeerSdp = document.getElementById("id_peer_sdp").value;
    var PeerSdp = { type : 'answer', sdp : strPeerSdp};
    m_PeerConn.setRemoteDescription(PeerSdp)
        .then(onSetRemoteSuccess, onSetRemoteError);
}


function fn_PeerIce()
{
    var strPeerIce = document.getElementById("id_peer_ice").value;
    var msg = {};
    msg = JSON.parse(strPeerIce);
    
    m_PeerConn.addIceCandidate(msg)
        .then(function(){self.onAddIcePeerCandidateSuccess(msg);},
        function(err){self.onAddIcePeerCandidateError(msg, err);});
}
