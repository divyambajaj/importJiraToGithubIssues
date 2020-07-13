# Migrate JIRA Issues to GitHub

## Export the issues from JIRA

First, create a full export to XML as described in this guide from your JIRA Account.

You'll need the exported `abc.xml` from JIRA to upload the issues to your GitHub repository using the GitHub API.

Add the Exported `abc.xml` file to your codebase's root directory.

## Run the import to GitHub

Run node index.js to use the script

```
Add the following information from your terminal:

1. Enter Github Username: "Enter your Github Username"
2. Enter Github Repo: "Enter your Github Repo Name"
3. Enter Github Token: "Enter the Generated Tokey Key from github"
4. Enter File Name (Note: add file in your root directory): "Enter the Jira Export xml"
5. Do you want to download Jira Attachements to your local? Answer with yes/no.: "Press yes if you want to download JIRA attachements to your local repo"


//optional - For adding the assignees. Map username of Jira and Github. Uncomment the lines jiraUsernameMapping in config.js and add the required mapping.
jiraUsernameMapping = {
    'Jira Account Username': 'GitHub Account',
  };
  
```

