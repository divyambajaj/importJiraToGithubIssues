const axios = require ('axios');
require ('colors');
const fs = require ('fs');
const request = require ('request');

const mileStoneObject = {};

module.exports = async (github, jsonData, jiraUserDetails) => {
  try {
    const URL = `https://api.github.com/repos/${github.user}/${github.repo}`;

    const config = {
      headers: {
        Authorization: `token ${github.token}`,
        'User-Agent': github.user,
      },
    };

    const jsonObject = JSON.parse (jsonData);
    const items = jsonObject['rss']['channel']['item'];

    //get milestone values
    await getMilestone (URL, config);

    var counter = 0;
    for (key in items) {
      var jiraIssue = items[key];
      var issue = {
        title: '',
        body: '',
        labels: [],
        assignees: [],
      };
      var githubComments = [];
      var jiraIssueKey = '';
      var jiraIssueReporter = '';

      // parsing jira title to github
      if (jiraIssue['title'] && Object.keys (jiraIssue['title']).length)
        issue.title = jiraIssue['title']['_text'];

      // parsing jira body to github
      if (
        jiraIssue['description'] &&
        Object.keys (jiraIssue['description']).length
      )
        issue.body = jiraIssue['description']['_text'];

      //parsing jira issue status and priority to github Lables

      if (jiraIssue['status'] && Object.keys (jiraIssue['status']).length)
        issue.labels = [...issue.labels, jiraIssue['status']['_text']];
      if (jiraIssue['priority'] && Object.keys (jiraIssue['priority']).length)
        issue.labels = [...issue.labels, jiraIssue['priority']['_text']];

      // parsing jira labels to github milestones
      if (jiraIssue['labels'] && Object.keys (jiraIssue['labels']).length) {
        var label = jiraIssue['labels']['label']['_text'];
        if (mileStoneObject.hasOwnProperty (label)) {
          issue.milestone = mileStoneObject[label];
        }
      }

      // parsing jira assignees to github
      if (jiraIssue['assignee'] && Object.keys (jiraIssue['assignee']).length) {
        var githubUsername = getAssigneeName (jiraIssue['assignee']['_text']);
        if (githubUsername !== null)
          issue.assignees = [...issue.assignees, githubUsername];
      }

      //parsing jira comments to github
      if (jiraIssue['comments'] && Object.keys (jiraIssue['comments']).length) {
        var jiraComments = jiraIssue['comments']['comment'];
        for (commentKey in jiraComments) {
          if (commentKey !== '_attributes') {
            if (jiraComments[commentKey].hasOwnProperty ('_text')) {
              var commentText = `Author: ${jiraComments[commentKey]['_attributes']['author']} ${jiraComments[commentKey]['_text']}`;
              githubComments = [...githubComments, {body: commentText}];
            } else {
              var commentText = `Author: ${jiraComments['_attributes']['author']} ${jiraComments[commentKey]}`;
              githubComments = [...githubComments, {body: commentText}];
            }
          }
        }
      }

      //fetch jira issue reporter
      if (jiraIssue['reporter'] && Object.keys (jiraIssue['reporter']).length) {
        jiraIssueReporter = jiraIssue['reporter']['_text'];
        issue.body = issue.body.replace (
          /^/,
          `<b>Reporter: ${jiraIssueReporter}</b>`
        );
      }

      // //fetch jira issue key
      if (jiraIssue['key'] && Object.keys (jiraIssue['key']).length) {
        jiraIssueKey = jiraIssue['key']['_text'];
      }

      //download attachements
      if (
        jiraIssue['attachments'] &&
        Object.keys (jiraIssue['attachments']).length &&
        jiraUserDetails
      ) {
        if (jiraIssue['attachments']['attachment'] !== undefined) {
          issue.body += `Attachements: `;
          if (Object.keys (jiraIssue['attachments']['attachment']).length > 1) {
            const attachements = jiraIssue['attachments']['attachment'];
            attachements.forEach ((attachment, index, arr) => {
              const attachmentName = `${jiraIssueKey}-${attachment['_attributes']['name']}`;
              if (!arr[index + 1]) {
                issue.body += ` ${attachmentName}`;
              } else {
                issue.body += `${attachmentName},`;
              }
              downloadAttachments (attachment, jiraIssueKey, jiraUserDetails);
            });
          } else {
            const attachment =
              jiraIssue['attachments']['attachment']['_attributes']['name'];
            const attachmentName = `${jiraIssueKey}-${attachment}`;
            issue.body += attachmentName;
            downloadAttachments (attachment, jiraIssueKey, jiraUserDetails);
          }
        }
      }

      // github api request
      const response = await axios.post (URL + '/issues', issue, config);
      if (response.status === 201) {
        if (response.data.number) {
          githubComments.forEach (async githubComment => {
            const commentURL =
              URL + '/issues/' + response.data.number + '/comments';
            const commentResponse = await axios.post (
              commentURL,
              githubComment,
              config
            );
          });
        }
        console.log (
          `Created an issue with title: "${response.data.title}"`.yellow
        );
        counter++;
      } else {
        console.log (`Not created ${issue.title}`.red);
        continue;
      }
    }
    console.log (`Total Issues created: ${counter}`.red);
  } catch (error) {
    console.log (error);
  }
};

const downloadAttachments = (attachment, jiraIssueKey, jiraUserDetails) => {
  const attachmentId = attachment['_attributes']['id'];
  const attachmentName = attachment['_attributes']['name'];
  const file = fs.createWriteStream (
    `jiraAttachements/${jiraIssueKey}-${attachmentName}`
  );
  const sendReq = request.get (
    `${jiraUserDetails.jiraBaseURL}/secure/attachment/${attachmentId}/${attachmentName}`,
    {
      auth: {
        user: jiraUserDetails.user,
        pass: jiraUserDetails.jiraToken,
      },
    }
  );
  sendReq.on ('response', response => {
    if (response.statusCode !== 200) {
      return cb ('Response status was ' + response.statusCode);
    }
    sendReq.pipe (file);
  });
};

const getMilestone = async (URL, config) => {
  return new Promise (function (resolve, reject) {
    axios.get (URL + '/milestones', config).then (
      response => {
        var result = response.data;
        result.forEach (async milestone => {
          var milestoneTitle = milestone['title'];
          mileStoneObject[milestoneTitle] = milestone['number'];
          resolve (mileStoneObject);
        });
      },
      error => {
        reject (error);
      }
    );
  });
};

const getAssigneeName = jiraUserName => {
  // add the mapping of jira users withgithub username. Below is the example.
  const mappingList = {
    'Test Jira Account Username': 'Test GitHub Account',
  };

  var githubUserName = mappingList[jiraUserName]
    ? mappingList[jiraUserName]
    : null;

  return githubUserName;
};
