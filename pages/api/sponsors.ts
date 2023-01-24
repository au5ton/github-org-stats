// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { NextApiRequest, NextApiResponse } from 'next'
import { Octokit } from '@octokit/rest'
import _ from 'lodash'

// the org in question
const org = 'au5ton';

/*

query {
  viewer {
    login
    sponsors {
      totalCount
    }
    sponsorsActivities(first: 20, period: ALL, orderBy: { direction: ASC, field: TIMESTAMP }) {
      edges {
        cursor
        node {
          __typename
          action
          timestamp
          sponsor {
            __typename
            ... on Organization {
              login
              id
              isSponsoringViewer
            }
            ... on User {
              login
              id
              isSponsoringViewer
            }
            
          }
          sponsorsTier {
            isOneTime
            isCustomAmount
          }
        }
      }
    }
    monthlyEstimatedSponsorsIncomeInCents 
  }
}

*/


export default async (req: NextApiRequest, res: NextApiResponse) => {
  // initialize
  const octokit = new Octokit({
    auth: process.env.OAUTH_TOKEN
  });

  const data = await octokit.graphql<any>(`
    query {
      viewer {
        login
        sponsors {
          totalCount
        }
        monthlyEstimatedSponsorsIncomeInCents
      }
    }
  `)

  // compose response
  const response = {
    totalSponsorCount: data.viewer.sponsors.totalCount, 
    monthlyEstimatedSponsorsIncomeInCents: data.viewer.monthlyEstimatedSponsorsIncomeInCents,
    monthlyEstimatedSponsorsIncomeFormatted: `${(data.viewer.monthlyEstimatedSponsorsIncomeInCents / 100).toFixed(2)}`
  };

  // cache response for 3 hours, SWR for 1 day
  res.setHeader('Cache-Control', 'public, must-revalidate, max-age=10800, stale-while-revalidate=86400');
  // cors stuff
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // return response
  return res.send(response);
}
