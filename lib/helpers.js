// export function get_cookie(key) {
//     const regexp = new RegExp(`.*${key}=([^;]*)`);
//     const result = regexp.exec(document.cookie);
//     if(result) return result[1];
// }

// export const uint16Max = 65535;
// const uint16Half = 32768;

export function csrf_token()
{
	return document.head.querySelector("[name=csrf-token][content]").content;
}

// export function current_is_greater_than(s1, s2)
// {
// 	return ((s1 > s2) && (s1 - s2 <= uint16Half)) ||
//            ((s1 < s2) && (s2 - s1 > uint16Half));
// }
