const { execSync } = require('child_process');

const currentBranch = getCurrentBranch();

function getDryRunConfig() {
  const config = {
    repositoryUrl: getLocalRepoUrl(),
    branches: getDryrunBranches(),
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
    ],
  };
  console.log(config);
  return config;
}

function getCIConfig() {
  return {
    plugins: [
      '@semantic-release/commit-analyzer',
      '@semantic-release/release-notes-generator',
      // 在其他分支不生成change log
      currentBranch === 'master' && [
        '@semantic-release/changelog',
        {
          changelogFile: 'CHANGELOG.md'
        }
      ],
      [
        '@semantic-release/npm',
        {
          npmPublish: true,
          tarballDir: 'release-tarballs',
        }
      ],
      [
        '@semantic-release/github',
        {
          assets: [
            {
              path: 'release-tarballs/*.tgz',
              label: 'Distribution Package (${nextRelease.gitTag})'
            }
          ],
          // // 添加这个注释，链接到完整的 CHANGELOG
          // successComment: '🎉 This release is available on:\n' +
          //   '- [npm package (@latest dist-tag)](https://www.npmjs.com/package/deploypal)\n' +
          //   '- [GitHub release](https://github.com/you/your-package/releases/tag/${nextRelease.gitTag})\n\n' +
          //   '📝 Full changelog: [CHANGELOG.md](https://github.com/you/your-package/blob/master/CHANGELOG.md)'
        }
      ],
      [
        '@semantic-release/git',
        {
          assets: [
            'CHANGELOG.md',
            'package.json'
          ],
          "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
        }
      ]
    ].filter(Boolean),
    branches: [
      'master',
      {
        name: 'beta',
        prerelease: true, // 这里使用beta值，则版本为1.0.0-beta.1,1.0.0-beta.2, 如果设置为true，则使用name，即1.0.0-next.1
        channel: 'next', // npm install deploypal@next 安装beta版本
      }
    ],
  };
}

function isDryRun() {
  return process.argv.includes('--dry-run');
}

function getLocalRepoUrl() {
  const topLevelDir = execSync('git rev-parse --show-toplevel')
    .toString()
    .trim();

  return `file://${topLevelDir}/.git`;
}

function getDryrunBranches() {
  const branchName = currentBranch;
  if (branchName === 'beta') {
    return [
      'master',
      {
        name: 'beta',
        prerelease: true
      },
    ];
  }
  return branchName;
}

function getCurrentBranch() {
  const branchName = execSync('git rev-parse --abbrev-ref HEAD')
    .toString()
    .trim();
  return branchName;
}

const releaseConfig = isDryRun() ? getDryRunConfig() : getCIConfig();

module.exports = releaseConfig;
