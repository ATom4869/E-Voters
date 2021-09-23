App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

initContract: function()
{
  $.getJSON("Election.json", function(election)
  {// Instantiate a new truffle contract from the artifact
  	App.contracts.Election = TruffleContract(election);
  	// Connect provider to interact with contract
  	App.contracts.Election.setProvider(App.web3Provider);
  	App.listenForEvents();
  	return App.render();
  });
},

  listenForEvents: function()
  {
  	App.contracts.Election.deployed().then(function(instance)
  	{instance.votedEvent({},{fromBlock: 0, toBlock: 'latest'
  	}).watch(function(error, event){
  		console.log("event triggered", event)
  		// Reload when a new vote is recorded
  		App.render();
  	});
  });
  },

  render: function()
  {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    var dcButton = $("#dcButton");
    var connectButton = $("#connectButton");
    var homeButton = $("#homeButton");

    loader.show();
    content.hide();
    connectButton.show();
    homeButton.hide();
    dcButton.hide();


    //Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#AlamatAkun").html("Akun kamu: " + account);
      }
    });

    //To do Login account in Metamask
    const ethereumButton = document.querySelector('.enableEthereumButton');

    ethereumButton.addEventListener('click', () => {
      getAccount();
    });

    async function getAccount()
    {
      accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#AlamatAkun").html("Akun kamu: " + account);
      }
      loader.hide();
      dcButton.hide();
      connectButton.hide();
      content.show();
    });
    }

    // Load contract data
    App.contracts.Election.deployed().then(function(instance)
    {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#HasilPemilihan");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(Kandidat)
        {
          var id = Kandidat[0];
          var name = Kandidat[1];
          var voteCount = Kandidat[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          //Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
    }
    return electionInstance.voters(App.account);
  }).then(function(hasVoted)
  {
  // Do not allow a user to vote
  if(hasVoted)
  {
  	$('form').hide();
    homeButton.show();
    content.show();
    loader.show();
    connectButton.hide();
  }
    loader.hide();
    content.Show();
    connectButton.hide();

    // const DisconnectButton = document.querySelector('.DisconnectAccButton');
    // DisconnectButton.addEventListener('click', () =>
    // {
    //   async function DisconnectAccount(){
    //   const permissions = await ethereum.request
    //   ({
    //     method: 'wallet_requestPermissions',
    //     params:
    //     [{
    //       eth_accounts: {},
    //     }]
    //   });
    //   }
    //   })
  }).catch(function(error)
  {
  	console.warn(error);
  });
},
castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});