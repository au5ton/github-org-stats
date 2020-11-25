// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from 'next'
import { Octokit } from '@octokit/rest'

// the org in question
const org = 'cougargrades';

// only check these repositories
const repository_whitelist = [
  { owner: 'cougargrades', name: 'web' },
  { owner: 'cougargrades', name: 'api' },
  { owner: 'cougargrades', name: 'types' },
  { owner: 'cougargrades', name: 'publicdata' },
  { owner: 'cougargrades', name: 'peoplesoft' },
  { owner: 'cougargrades', name: 'collegescheduler' },
];

// remove bots disguised as users
const user_blacklist = [
  { id: 31427850, login: 'ImgBotApp' }
]

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // initialize
  const octokit = new Octokit({
    auth: process.env.OAUTH_TOKEN
  });

  const cache: { [key: string]: string } = {};
  const public_member_cache: number[] = [];


  // compose response
  const response = {
    public_members: await Promise.all((await octokit.orgs.listPublicMembers({ org }))
      .data
      // filter out bots
      .filter(e => e.type === 'User')
      // we are missing the "name" field, lets go get it
      .map(async ({ id, login, html_url, avatar_url }) => {
        // for each user in the response, get their "name"
        const { name } = (await octokit.users.getByUsername({ username: login })).data;

        // cache this user's name
        cache[login] = name;
        public_member_cache.push(id);
        
        // return formatted public member
        return {
          id,
          name,
          login,
          html_url,
          avatar_url
        }
      })
    ),
    contributors: (await Promise.all(
      repository_whitelist
      .map(async ({ owner, name }) => {
        // for every repo in the response, get their contributors
        return await Promise.all((await octokit.repos.listContributors({ owner: owner, repo: name }))
          .data
          // filter out bots
          .filter(e => e.type === 'User')
          // we are missing the "name" field, lets go get it
          .map(async ({ id, login, html_url, avatar_url }) => {
            // if this user's name is cached, skip our API call
            if(cache[login] !== undefined) {
              return {
                id,
                name: cache[login],
                login,
                html_url,
                avatar_url
              }
            }
            else {
              // if user's name isn't cached, get it
              const { name } = (await octokit.users.getByUsername({ username: login })).data;
              return {
                id,
                name,
                login,
                html_url,
                avatar_url
              }
            }
          }))
      })))
      // flatten nested array
      .flat()
      // remove duplicates (see: https://stackoverflow.com/a/36744732)
      .filter((obj, index, self) => self.findIndex(t => t.id === obj.id) === index)
      // remove public members, we only want non-member contributors
      .filter(e => public_member_cache.includes(e.id))
  };

  // cache response for 7 days
  res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate');
  // cors stuff
  res.setHeader('Access-Control-Allow-Origin', '*');

  // return response
  return res.json(response);
}
