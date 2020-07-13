const prompt = require ('prompt-sync') ({sigint: true});

module.exports = () => {
  const gitHubData = {
    user: '',
    repo: '',
    token: '',
  };

  var jiraUsernameMapping = {};

  gitHubData.user = prompt ('Enter Github Username: ');
  gitHubData.repo = prompt ('Enter Github Repo: ');
  gitHubData.token = prompt ('Enter Github Token: ');

  const fileName = prompt (
    'Enter File Name (Note: add file in your root directory): '
  );

  // add the mapping of jira users withgithub username. Below is the example.
  jiraUsernameMapping = {
    'Jira Account Username': 'GitHub Account',
  };

  if (Object.keys (jiraUsernameMapping).length === 0) {
    jiraUsernameMapping = false;
  }
  var configValues = {gitHubData, fileName, jiraUsernameMapping};

  const jiraUserDetails = downloadJiraAttachement ();
  configValues = {...configValues, jiraUserDetails: jiraUserDetails};
  return configValues;
};

const downloadJiraAttachement = () => {
  const downloadJiraAttachements = prompt (
    'Do you want to download Jira Attachements to your local? Answer with yes/no.: '
  );

  if (downloadJiraAttachements === 'yes' || downloadJiraAttachements === 'y') {
    const jiraUserDetails = {
      jiraBaseURL: '',
      user: '',
      jiraToken: '',
    };

    jiraUserDetails.jiraBaseURL = prompt (
      'Enter your Organisations Jira Base URL: '
    );
    jiraUserDetails.user = prompt ('Enter your Jira User EmailID: ');
    jiraUserDetails.jiraToken = prompt ('Enter your Jira Token: ');
    return jiraUserDetails;
  } else if (
    downloadJiraAttachements === 'no' ||
    downloadJiraAttachements === 'n'
  ) {
    return false;
  } else {
    console.log ('Please select a Valid Input'.yellow);
    return downloadJiraAttachement ();
  }
};
