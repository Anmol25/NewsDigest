type SidebarItem = {
    name: string;
    to: string;
    image: string;
    image_fill: string;
};

export const SIDEBAR_TOP_LIST: SidebarItem[] = [
    {name:'Home',to:'/home', image:'ri-home-2-line', image_fill: 'ri-home-2-fill'},
    {name:'For You',to:'/for-you', image:'ri-heart-line', image_fill: 'ri-heart-fill'},
    {name:'News', to:'/news', image:'ri-article-line', image_fill: 'ri-article-fill'},
    {name:'Channels',to:'/channels', image:'ri-megaphone-line', image_fill: 'ri-megaphone-fill'},
    {name:'Subscriptions',to:'/subscriptions', image:'ri-star-line', image_fill: 'ri-star-fill'},
    {name:'Saved',to:'/saved', image:'ri-bookmark-line', image_fill: 'ri-bookmark-fill'},
    {name:'History',to:'/history', image:'ri-time-line', image_fill: 'ri-time-fill'}
]

export const SIDEBAR_BOTTOM_LIST: SidebarItem[] = [
    {name:'Settings',to:'/profile', image:'ri-settings-4-line', image_fill: 'ri-settings-4-fill'},
    {name:'Log Out',to:'/logout', image:'ri-logout-box-line', image_fill: 'ri-logout-box-fill'}
]