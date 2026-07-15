// টোকেন সেভ করা
export const saveToken = (token) => {
    localStorage.setItem('uber_jwt_token', token);
  };
  
  // টোকেন রিড করা
  export const getToken = () => {
    return localStorage.getItem('uber_jwt_token');
  };
  
  // লগআউট বা টোকেন রিমুভ করা
  export const logout = () => {
    localStorage.removeItem('uber_jwt_token');
  };