export const DonationDAOAbi = [
  { "type": "constructor", "inputs": [
      {"name":"_usdt","type":"address","internalType":"address"},
      {"name":"initialDaoMembers","type":"address[]","internalType":"address[]"}
    ]
  },
  { "type": "function", "stateMutability": "view", "name": "totalDisbursed", "inputs": [], "outputs": [{"name":"","type":"uint256","internalType":"uint256"}] },
  { "type": "function", "stateMutability": "view", "name": "getFundBalance", "inputs": [], "outputs": [{"name":"","type":"uint256","internalType":"uint256"}] },
  { "type": "function", "stateMutability": "view", "name": "getDashboardStats", "inputs": [], "outputs": [
    {"name":"fund","type":"uint256","internalType":"uint256"},
    {"name":"disbursed","type":"uint256","internalType":"uint256"},
    {"name":"projectsVoting","type":"uint256","internalType":"uint256"},
    {"name":"allProjects","type":"uint256","internalType":"uint256"}
  ] },
  { "type": "function", "stateMutability": "view", "name": "getRequestCounts", "inputs": [], "outputs": [
    {"name":"total","type":"uint256","internalType":"uint256"},
    {"name":"pending","type":"uint256","internalType":"uint256"},
    {"name":"disbursed","type":"uint256","internalType":"uint256"},
    {"name":"rejected","type":"uint256","internalType":"uint256"}
  ] },
  { "type": "function", "stateMutability": "view", "name": "getProjectCounts", "inputs": [], "outputs": [
    {"name":"total","type":"uint256","internalType":"uint256"},
    {"name":"voting","type":"uint256","internalType":"uint256"},
    {"name":"active","type":"uint256","internalType":"uint256"},
    {"name":"closed","type":"uint256","internalType":"uint256"},
    {"name":"rejected","type":"uint256","internalType":"uint256"}
  ] },
  { "type": "function", "stateMutability": "nonpayable", "name": "donate", "inputs": [{"name":"amount","type":"uint256","internalType":"uint256"}], "outputs": [] },
  { "type": "function", "stateMutability": "nonpayable", "name": "createRequest", "inputs": [
      {"name":"amount","type":"uint256","internalType":"uint256"},
      {"name":"description","type":"string","internalType":"string"},
      {"name":"proofHash","type":"string","internalType":"string"}
    ], "outputs": [] },
  { "type": "function", "stateMutability": "nonpayable", "name": "vote", "inputs": [
      {"name":"requestId","type":"uint256","internalType":"uint256"},
      {"name":"decision","type":"bool","internalType":"bool"}
    ], "outputs": [] },
  { "type": "function", "stateMutability": "view", "name": "getAllRequests", "inputs": [], "outputs": [{
      "name":"","type":"tuple[]","components": [
        {"name":"id","type":"uint256","internalType":"uint256"},
        {"name":"beneficiary","type":"address","internalType":"address"},
        {"name":"amount","type":"uint256","internalType":"uint256"},
        {"name":"description","type":"string","internalType":"string"},
        {"name":"proofHash","type":"string","internalType":"string"},
        {"name":"approveCount","type":"uint256","internalType":"uint256"},
        {"name":"rejectCount","type":"uint256","internalType":"uint256"},
        {"name":"paid","type":"bool","internalType":"bool"},
        {"name":"done","type":"bool","internalType":"bool"}
      ], "internalType":"struct DonationDAO.RequestView[]"
    }] },
  { "type": "function", "stateMutability": "view", "name": "getAllProjects", "inputs": [], "outputs": [{
      "name":"","type":"tuple[]","components": [
        {"name":"id","type":"uint256","internalType":"uint256"},
        {"name":"owner","type":"address","internalType":"address"},
        {"name":"title","type":"string","internalType":"string"},
        {"name":"description","type":"string","internalType":"string"},
        {"name":"proofHash","type":"string","internalType":"string"},
        {"name":"targetAmount","type":"uint256","internalType":"uint256"},
        {"name":"deadline","type":"uint256","internalType":"uint256"},
        {"name":"totalFunded","type":"uint256","internalType":"uint256"},
        {"name":"approved","type":"bool","internalType":"bool"},
        {"name":"decisionMade","type":"bool","internalType":"bool"},
        {"name":"closed","type":"bool","internalType":"bool"},
        {"name":"approveCount","type":"uint256","internalType":"uint256"},
        {"name":"rejectCount","type":"uint256","internalType":"uint256"}
      ], "internalType":"struct DonationDAO.ProjectView[]"
    }] },
  { "type": "function", "stateMutability": "nonpayable", "name": "createProject", "inputs": [
      {"name":"title","type":"string","internalType":"string"},
      {"name":"description","type":"string","internalType":"string"},
      {"name":"proofHash","type":"string","internalType":"string"},
      {"name":"targetAmount","type":"uint256","internalType":"uint256"},
      {"name":"deadline","type":"uint256","internalType":"uint256"}
    ], "outputs": [] },
  { "type": "function", "stateMutability": "nonpayable", "name": "voteOnProject", "inputs": [
      {"name":"projectId","type":"uint256","internalType":"uint256"},
      {"name":"decision","type":"bool","internalType":"bool"}
    ], "outputs": [] },
  { "type": "function", "stateMutability": "nonpayable", "name": "donateToProject", "inputs": [
      {"name":"projectId","type":"uint256","internalType":"uint256"},
      {"name":"amount","type":"uint256","internalType":"uint256"}
    ], "outputs": [] },
  { "type": "function", "stateMutability": "nonpayable", "name": "closeProject", "inputs": [
      {"name":"projectId","type":"uint256","internalType":"uint256"}
    ], "outputs": [] },
  { "type": "function", "stateMutability": "view", "name": "getActivities", "inputs": [], "outputs": [{
      "name":"","type":"tuple[]","components": [
        {"name":"id","type":"uint256","internalType":"uint256"},
        {"name":"activityType","type":"uint8","internalType":"enum DonationDAO.ActivityType"},
        {"name":"creator","type":"address","internalType":"address"},
        {"name":"title","type":"string","internalType":"string"},
        {"name":"description","type":"string","internalType":"string"},
        {"name":"amountOrTarget","type":"uint256","internalType":"uint256"},
        {"name":"creationTimestamp","type":"uint256","internalType":"uint256"}
      ], "internalType":"struct DonationDAO.ActivityItem[]"
    }] },
  { "type": "function", "stateMutability": "view", "name": "getPendingVotesFor", "inputs": [
      {"name":"_voter","type":"address","internalType":"address"}
    ], "outputs": [{
      "name":"","type":"tuple[]","components": [
        {"name":"id","type":"uint256","internalType":"uint256"},
        {"name":"activityType","type":"uint8","internalType":"enum DonationDAO.ActivityType"},
        {"name":"creator","type":"address","internalType":"address"},
        {"name":"title","type":"string","internalType":"string"},
        {"name":"description","type":"string","internalType":"string"},
        {"name":"amountOrTarget","type":"uint256","internalType":"uint256"},
        {"name":"creationTimestamp","type":"uint256","internalType":"uint256"}
      ], "internalType":"struct DonationDAO.ActivityItem[]"
    }] },
  { "type": "function", "stateMutability": "view", "name": "getRequestById", "inputs": [
      {"name":"requestId","type":"uint256","internalType":"uint256"}
    ], "outputs": [{
      "name":"","type":"tuple","components": [
        {"name":"id","type":"uint256","internalType":"uint256"},
        {"name":"beneficiary","type":"address","internalType":"address"},
        {"name":"amount","type":"uint256","internalType":"uint256"},
        {"name":"description","type":"string","internalType":"string"},
        {"name":"proofHash","type":"string","internalType":"string"},
        {"name":"approveCount","type":"uint256","internalType":"uint256"},
        {"name":"rejectCount","type":"uint256","internalType":"uint256"},
        {"name":"paid","type":"bool","internalType":"bool"},
        {"name":"done","type":"bool","internalType":"bool"}
      ], "internalType":"struct DonationDAO.RequestView"
    }] },
  { "type": "function", "stateMutability": "view", "name": "getProjectById", "inputs": [
      {"name":"projectId","type":"uint256","internalType":"uint256"}
    ], "outputs": [{
      "name":"","type":"tuple","components": [
        {"name":"id","type":"uint256","internalType":"uint256"},
        {"name":"owner","type":"address","internalType":"address"},
        {"name":"title","type":"string","internalType":"string"},
        {"name":"description","type":"string","internalType":"string"},
        {"name":"proofHash","type":"string","internalType":"string"},
        {"name":"targetAmount","type":"uint256","internalType":"uint256"},
        {"name":"deadline","type":"uint256","internalType":"uint256"},
        {"name":"totalFunded","type":"uint256","internalType":"uint256"},
        {"name":"approved","type":"bool","internalType":"bool"},
        {"name":"decisionMade","type":"bool","internalType":"bool"},
        {"name":"closed","type":"bool","internalType":"bool"},
        {"name":"approveCount","type":"uint256","internalType":"uint256"},
        {"name":"rejectCount","type":"uint256","internalType":"uint256"}
      ], "internalType":"struct DonationDAO.ProjectView"
    }] },
  { "type": "function", "stateMutability": "view", "name": "hasVotedOnRequest", "inputs": [
      {"name":"requestId","type":"uint256","internalType":"uint256"},
      {"name":"voter","type":"address","internalType":"address"}
    ], "outputs": [{"name":"","type":"bool","internalType":"bool"}] },
  { "type": "function", "stateMutability": "view", "name": "hasVotedOnProject", "inputs": [
      {"name":"projectId","type":"uint256","internalType":"uint256"},
      {"name":"voter","type":"address","internalType":"address"}
    ], "outputs": [{"name":"","type":"bool","internalType":"bool"}] },
  { "type": "function", "stateMutability": "view", "name": "getProjectDonation", "inputs": [
      {"name":"projectId","type":"uint256","internalType":"uint256"},
      {"name":"donor","type":"address","internalType":"address"}
    ], "outputs": [{"name":"","type":"uint256","internalType":"uint256"}] },
  { "type": "function", "stateMutability": "view", "name": "daoMembers", "inputs": [
      {"name":"","type":"address","internalType":"address"}
    ], "outputs": [{"name":"","type":"bool","internalType":"bool"}] },
  { "type": "function", "stateMutability": "view", "name": "daoMemberCount", "inputs": [], "outputs": [{"name":"","type":"uint256","internalType":"uint256"}] },
  { "type": "function", "stateMutability": "view", "name": "requestCount", "inputs": [], "outputs": [{"name":"","type":"uint256","internalType":"uint256"}] },
  { "type": "function", "stateMutability": "view", "name": "projectCount", "inputs": [], "outputs": [{"name":"","type":"uint256","internalType":"uint256"}] },
  { "type": "function", "stateMutability": "view", "name": "activeRequestCount", "inputs": [
      {"name":"","type":"address","internalType":"address"}
    ], "outputs": [{"name":"","type":"uint256","internalType":"uint256"}] },
  { "type": "function", "stateMutability": "nonpayable", "name": "addDaoMember", "inputs": [
      {"name":"_newMember","type":"address","internalType":"address"}
    ], "outputs": [] },
  { "type": "function", "stateMutability": "view", "name": "usdt", "inputs": [], "outputs": [{"name":"","type":"address","internalType":"address"}] },
  { "type": "event", "name": "DonationReceived", "inputs": [
      {"name":"donor","type":"address","indexed":true,"internalType":"address"},
      {"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "RequestCreated", "inputs": [
      {"name":"id","type":"uint256","indexed":true,"internalType":"uint256"},
      {"name":"beneficiary","type":"address","indexed":true,"internalType":"address"},
      {"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "VoteCast", "inputs": [
      {"name":"requestId","type":"uint256","indexed":true,"internalType":"uint256"},
      {"name":"voter","type":"address","indexed":true,"internalType":"address"},
      {"name":"decision","type":"bool","indexed":false,"internalType":"bool"}
    ] },
  { "type": "event", "name": "PayoutSuccess", "inputs": [
      {"name":"requestId","type":"uint256","indexed":true,"internalType":"uint256"},
      {"name":"beneficiary","type":"address","indexed":true,"internalType":"address"},
      {"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "RequestRejected", "inputs": [
      {"name":"requestId","type":"uint256","indexed":true,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "ProjectCreated", "inputs": [
      {"name":"projectId","type":"uint256","indexed":true,"internalType":"uint256"},
      {"name":"owner","type":"address","indexed":true,"internalType":"address"},
      {"name":"title","type":"string","indexed":false,"internalType":"string"}
    ] },
  { "type": "event", "name": "ProjectVoteCast", "inputs": [
      {"name":"projectId","type":"uint256","indexed":true,"internalType":"uint256"},
      {"name":"voter","type":"address","indexed":true,"internalType":"address"},
      {"name":"decision","type":"bool","indexed":false,"internalType":"bool"}
    ] },
  { "type": "event", "name": "ProjectApproved", "inputs": [
      {"name":"projectId","type":"uint256","indexed":true,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "ProjectRejected", "inputs": [
      {"name":"projectId","type":"uint256","indexed":true,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "ProjectDonation", "inputs": [
      {"name":"projectId","type":"uint256","indexed":true,"internalType":"uint256"},
      {"name":"donor","type":"address","indexed":true,"internalType":"address"},
      {"name":"amount","type":"uint256","indexed":false,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "ProjectClosed", "inputs": [
      {"name":"projectId","type":"uint256","indexed":true,"internalType":"uint256"},
      {"name":"totalFunded","type":"uint256","indexed":false,"internalType":"uint256"}
    ] },
  { "type": "event", "name": "DaoMemberAdded", "inputs": [
      {"name":"newMember","type":"address","indexed":true,"internalType":"address"},
      {"name":"addedBy","type":"address","indexed":true,"internalType":"address"}
    ] }
]

// export const DONATION_DAO_ADDRESS = '0x47097B704Bd8D34d037fa21837D7f890B68fE7Ee'
export const DONATION_DAO_ADDRESS = '0xd61AeC17B56F39198eBCb75313E1f9Bf674BfaEE'
// export const USDT_ADDRESS = '0x2c97BC95cd2De8bD217a7c4dFeC4CC4eC0179906'
export const USDT_ADDRESS = '0x760f74c0e28766048aEB8C484F68453Ded161e31'

