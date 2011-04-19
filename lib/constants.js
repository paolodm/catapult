var status_index = 0, page_types = 0;
module.exports = {
    MILLISECONDS_PER_MINUTE: 1000*60,
    MILLISECONDS_PER_HOUR: 1000*60*60,
    MILLISECONDS_PER_DAY:  1000*60*60*24,
    UPDATE_INTERVAL_MINUTES: 45,
    TIMEFRAMES: {
        '2010 ':    { start_date: +new Date('1/1/2010'), end_date: +new Date('1/1/2011') },
        '2010 Q1':  { start_date: +new Date('1/1/2010'), end_date: +new Date('3/1/2010') },
        '2010 Q2':  { start_date: +new Date('3/1/2010'), end_date: +new Date('6/1/2010') },
        '2010 Q3':  { start_date: +new Date('6/1/2010'), end_date: +new Date('9/1/2010') },
        '2010 Q4':  { start_date: +new Date('9/1/2010'), end_date: +new Date('1/1/2011') },
        '2011 ':    { start_date: +new Date('1/1/2011'), end_date: +new Date('1/1/2012') },
        '2011 Q1':  { start_date: +new Date('1/1/2011'), end_date: +new Date('3/1/2011') },
        '2011 Q2':  { start_date: +new Date('3/1/2011'), end_date: +new Date('6/1/2011') },
        'Last 7 Days': { start_date:  -604800000, end_date: +new Date('4/1/3011') },
        'Last 48 Hours': { start_date:  -172800000, end_date: +new Date('4/1/3011') },
        'All Time': { start_date: +new Date('1/1/2000'), end_date: +new Date('4/1/3011') }
    },
    THRESHOLDS: {
        low:            11,
        medium:         31,
        high:           9999
    },
    STATUS_INACTIVE: {
        'Rejected by Hiring Manager': true,
        'Not Approved': true,
        'Offer Rejected': true,
        'Offer Accepted': true,
        'Rejected': true,
        'Hold/position is inactive': true
    },
    STATUS_OFFER: {
        'Pending Approval': true,
        'Offer Accepted': true,
        'Approved': true,
        'Not Approved': true,
        'Offer Generation': true,
        'Offer Sent': true,
        'Offer Rejected': true
    },
    NO_JOB: {
        'Athlete Pool': true,
        'General Application': true
    },
    STATUS_ORDER: {
        'Unknown':                      {index: status_index++, hide: true, owner: true},
        'New':                          {index: status_index++},
        'Screened':                     {index: status_index++},
        'Submitted to Hiring Manager':  {index: status_index++, short: 'Sub to Hire Mgr'},
        'Approved by Hiring Manager':   {index: status_index++, short: 'Apprvd by Hre Mgr'},

        'Approved':                     {index: status_index++, hide: true, owner: true},

        'Phone Screen':                 {index: status_index++},
        'Phone Interview':              {index: status_index++},
        'Homework/Quiz':                {index: status_index++, short: 'Assign HW'},
        'Review Quiz/Homework':         {index: status_index++, short: 'Review HW'},
        'Interview':                    {index: status_index++},

        'Pending Post-Onsite Decision': {index: status_index++, short: 'Pending Decision'},

        'Pending Approval':             {index: status_index++, hide: true, owner: true},
        'To Be Scheduled':              {index: status_index++, hide: true, owner: true},
        'Rejected by Hiring Manager':   {index: status_index++, hide: true, owner: true},
        'Reference Check':              {index: status_index++, hide: true, owner: true},
        'Schedule Rejection Call':      {index: status_index++, hide: true, owner: true},
        'Rejection Call':               {index: status_index++, hide: true, owner: true},
        'Offer Generation':             {index: status_index++, hide: true, owner: true},
        'Offer Sent':                   {index: status_index++, hide: true, owner: true},
        'Offer Rejected':               {index: status_index++, hide: true },

        'Hold/position is inactive':    {index: status_index++, hide: true},
        'Rejected':                     {index: status_index++, hide: true, rejected: true},

        'Offer Accepted':               {index: status_index++, hide: true, hired: true, long: 'Hired!' }

    },
    PAGE_TYPE: {
        sources:                        page_types++,
        source:                         page_types++,
        recruiters:                     page_types++,
        recruiter:                      page_types++,
        managers:                       page_types++,
        manager:                        page_types++,
        teams:                          page_types++,
        team:                           page_types++,
        jobs:                           page_types++,
        job:                            page_types++,
        search:                         page_types++
    },
    ADMIN_LIST: {
        'Dylan Greene':                 true,
        'Vinny Magno':                  true,
        'Roderic Morris':               true,
        'Garrett Miller':               true
    }
};